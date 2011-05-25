# Copyright (c) Django Software Foundation and individual contributors.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without modification,
# are permitted provided that the following conditions are met:
#
#     1. Redistributions of source code must retain the above copyright notice,
#        this list of conditions and the following disclaimer.
#
#     2. Redistributions in binary form must reproduce the above copyright
#        notice, this list of conditions and the following disclaimer in the
#        documentation and/or other materials provided with the distribution.
#
#     3. Neither the name of Django nor the names of its contributors may be used
#        to endorse or promote products derived from this software without
#        specific prior written permission.

# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
# ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
# WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
# ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
# (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
# LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
# ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
# SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

"""
API token, strongly inspired by Django 1.3 token handling utilities
"""

import hmac
from datetime import datetime
from django.conf import settings
from django.utils.http import int_to_base36, base36_to_int
from django.utils.hashcompat import sha_constructor, sha_hmac


def salted_hmac(key_salt, value, secret=None):
    """
    Returns the HMAC-SHA1 of 'value', using a key generated from key_salt and a
    secret (which defaults to settings.SECRET_KEY).

    A different key_salt should be passed in for every application of HMAC.
    """
    if secret is None:
        secret = settings.SECRET_KEY

    # We need to generate a derived key from our base key.  We can do this by
    # passing the key_salt and our base key through a pseudo-random function and
    # SHA1 works nicely.
    key = sha_constructor(key_salt + secret).digest()

    # If len(key_salt + secret) > sha_constructor().block_size, the above
    # line is redundant and could be replaced by key = key_salt + secret, since
    # the hmac module does the same thing for keys longer than the block size.
    # However, we need to ensure that we *always* do this.

    return hmac.new(key, msg=value, digestmod=sha_hmac)


def constant_time_compare(val1, val2):
    """
    Returns True if the two strings are equal, False otherwise.

    The time taken is independent of the number of characters that match.
    """
    if len(val1) != len(val2):
        return False
    result = 0
    for x, y in zip(val1, val2):
        result |= ord(x) ^ ord(y)
    return result == 0


class CategoriesApiTokenGenerator(object):
    """
    Strategy object used to generate and check tokens for the password
    reset mechanism.
    """
    def make_token(self, node):
        """
        Returns a token that can be used once to do a operation with
        the Categories API.
        """
        return self._make_token_with_timestamp(node, self._num_minutes(self._now()))

    def check_token(self, node, token):
        """
        Check that a Categories API token is correct for a given Category instance.
        """
        # Parse the token
        try:
            ts_b36, hash = token.split("-")
        except ValueError:
            return False

        try:
            ts = base36_to_int(ts_b36)
        except ValueError:
            return False

        # Check that the timestamp/uid has not been tampered with
        if not constant_time_compare(self._make_token_with_timestamp(node, ts), token):
            return False

        # Check the timestamp is within limit (10 minutes)
        if (self._num_minutes(self._now()) - ts) > 10:
            return False

        return True

    def _make_token_with_timestamp(self, node, timestamp):
        # timestamp is number of minutes since the first minute of 2011-1-1.
        # Converted to base 36, this gives us a 5 digit string until datetime(2125, 12, 19, 9, 35)
        ts_b36 = int_to_base36(timestamp)

        # By hashing on the internal state of the node and using state that is
        # sure to change, we produce a hash that will be invalid as soon as it
        # is used.
        # We limit the hash to 20 chars to keep URL short
        key_salt = "categorizetags.utils.CategoriesApiTokenGenerator"
        value = str(node.id) + \
            unicode(node.name) + \
            str(node.lft) + \
            str(node.rght) + \
            str(timestamp)
        hash = salted_hmac(key_salt, value).hexdigest()[:14]
        return "%s-%s" % (ts_b36, hash)

    def _num_minutes(self, dt):
        dif = dt - datetime(2011, 1, 1, 0, 0)
        return dif.seconds / 60 + dif.days * 24 * 60

    def _now(self):
        # Used for mocking in tests
        return datetime.now()
