try:
    from functools import wraps
except ImportError:
    from django.utils.functional import wraps  # Python 2.4 fallback.

from categories.models import Category

from django.conf import settings

#from django.db import IntegrityError
from django.core import exceptions
from django.core.urlresolvers import reverse
from django.http import (Http404, HttpResponse, HttpResponseRedirect,
        HttpResponseForbidden, HttpResponseNotAllowed)
from django.utils import simplejson
from django.utils.translation import ugettext as _
from django.views.decorators.csrf import csrf_exempt

from django.conf import settings as settings
from categorizetags.utils import CategoriesApiTokenGenerator
from categorizetags.models import generate_tree, TagCategory

tmp = __import__(settings.TAG_MODEL_MODULE, globals(), locals(), ['Tag'], -1)
TAG = tmp.Tag

def user_is_super_or_staff(user):
    return (user.is_superuser or user.is_staff)

@csrf_exempt
def admin_ajax_post(view_func):
    """
    Decorator for Django views that checks that the request is:
    * Sent via ajax
    * Uses POST
    * by an authenticated Askbot administrator user
    """
    @wraps(view_func)
    def inner(request, *args, **kwargs):
        if not settings.ENABLE_CATEGORIES:
            raise Http404
        try:
            if not request.is_ajax():
                #todo: show error page but no-one is likely to get here
                return HttpResponseRedirect(reverse('index'))
            if request.method != 'POST':
                raise exceptions.PermissionDenied('must use POST request')
            if not request.user.is_authenticated():
                raise exceptions.PermissionDenied(
                    _('Sorry, but anonymous users cannot access this view')
                )
            if not user_is_super_or_staff(request.user):
                raise exceptions.PermissionDenied(
                    _('Sorry, but you cannot access this view')
                )
            return view_func(request, *args, **kwargs)
        except Exception, e:
            response_data = dict()
            message = unicode(e)
            if message == '':
                message = _('Oops, apologies - there was some error')
            response_data['message'] = message
            response_data['status'] = 'error'
            data = simplejson.dumps(response_data)
            return HttpResponse(data, mimetype="application/json")
    return inner

@admin_ajax_post
def add_category(request):
    """
    Adds a category. Meant to be called by the site administrator using ajax
    and POST HTTP method.
    The expected json request is an object with the following keys:
      'name': Name of the new category to be created.
      'parent': ID of the parent category for the category to be created.
    The response is also a json object with keys:
      'status': Can be either 'success' or 'error'
      'message': Text description in case of failure (not always present)

    Category IDs are the Django integer PKs of the respective model instances.
    """
    parent = request.POST.get('parent')
    new_name = request.POST.get('name')
    if not new_name:
        raise exceptions.ValidationError(
            _("Missing or invalid new category name parameter")
            )
    # TODO: there is a chance of a race condition here
    if parent:
        try:
            parent = Category.objects.get(id=parent)
        except Category.DoesNotExist:
            raise exceptions.ValidationError(
                _("Requested parent category doesn't exist")
                )
    cat, created = Category.objects.get_or_create(name=new_name, defaults={'parent': parent})
    if not created:
        raise exceptions.ValidationError(
            _('There is already a category with that name')
            )
    response_data = {'status': 'success', 'id': cat.id}
    data = simplejson.dumps(response_data)
    return HttpResponse(data, mimetype="application/json")

@admin_ajax_post
def rename_category(request):
    """
    Change the name of a category. Meant to be called by the site administrator
    using ajax and POST HTTP method.
    The expected json request is an object with the following keys:
      'id': ID of the category to be renamed.
      'name': New name of the category.
    The response is also a json object with keys:
      'status': Can be 'success', 'noop' or 'error'
      'message': Text description in case of failure (not always present)

    Category IDs are the Django integer PKs of the respective model instances.
    """
    new_name = request.POST.get('name')
    cat_id = request.POST.get('id')
    if not new_name or not cat_id:
        raise exceptions.ValidationError(
            _("Missing or invalid required parameter")
            )
    response_data = dict()
    # TODO: there is a chance of a race condition here
    try:
        node = Category.objects.get(id=cat_id)
    except Category.DoesNotExist:
        raise exceptions.ValidationError(
            _("Requested category doesn't exist")
            )
    if new_name != node.name:
        try:
            node = Category.objects.get(name=new_name)
        except Category.DoesNotExist:
            pass
        else:
            raise exceptions.ValidationError(
                _('There is already a category with that name')
                )
        node.name=new_name
        # Let any exception that happens during save bubble up, for now
        node.save()
        response_data['status'] = 'success'
    else:
        response_data['status'] = 'noop'
    data = simplejson.dumps(response_data)
    return HttpResponse(data, mimetype="application/json")

@admin_ajax_post
def add_tag_to_category(request):
    """
    Adds a tag to a category. Meant to be called by the site administrator using ajax
    and POST HTTP method.
    Both the tag and the category must exist and their IDs are provided to
    the view.
    The expected json request is an object with the following keys:
      'tag_name': name of the tag.
      'cat_id': ID of the category.
    The response is also a json object with keys:
      'status': Can be either 'success' or 'error'
      'message': Text description in case of failure (not always present)

    Category IDs are the Django integer PKs of the respective model instances.
    """
    tag_name = request.POST.get('tag_name')
    cat_id = request.POST.get('cat_id')
    if not tag_name or cat_id is None:
        raise exceptions.ValidationError(
            _("Missing required parameter")
            )
    # TODO: there is a chance of a race condition here
    try:
        cat = Category.objects.get(id=cat_id)
    except Category.DoesNotExist:
        raise exceptions.ValidationError(
            _("Requested category doesn't exist")
            )

    global TAG
    try:
        tag = TAG.objects.get(name=tag_name)
    except TAG.DoesNotExist:
        raise exceptions.ValidationError(
            _("Requested tag doesn't exist")
            )
    # Let any exception that could happen during save bubble up
    tag_category = TagCategory(tag = tag, category = cat)
    tag_category.save()
    response_data = {'status': 'success'}
    data = simplejson.dumps(response_data)
    return HttpResponse(data, mimetype="application/json")

@csrf_exempt
def get_tag_categories(request):
    """
    Get the categories a tag belongs to. Meant to be called using ajax
    and POST HTTP method. Available to everyone including anonymous users.
    The expected json request is an object with the following key:
      'tag_name': name of the tag. (required)
    The response is also a json object with keys:
      'status': Can be either 'success' or 'error'
      'cats': A list of dicts with keys 'id' (value is a integer category ID)
         and 'name' (value is a string) for each category
      'message': Text description in case of failure (not always present)
    """
    if not settings.ENABLE_CATEGORIES:
        raise Http404
    response_data = dict()
    try:
        if request.is_ajax():
            if request.method == 'POST':
                tag_name = request.POST.get('tag_name')
                if not tag_name:
                    raise exceptions.ValidationError(
                        _("Missing tag_name parameter")
                        )
                global TAG
                try:
                    tag = TAG.objects.get(name=tag_name)
                except TAG.DoesNotExist:
                    raise exceptions.ValidationError(
                        _("Requested tag doesn't exist")
                        )
                response_data['cats'] = list(
                                Category.objects.filter(
                                    tagcategory__tag = tag
                                ).values(
                                    'id', 'name'
                                )
                            )
                response_data['status'] = 'success'
                data = simplejson.dumps(response_data)
                return HttpResponse(data, mimetype="application/json")
            else:
                raise exceptions.PermissionDenied('must use POST request')
        else:
            #todo: show error page but no-one is likely to get here
            return HttpResponseRedirect(reverse('index'))
    except Exception, e:
        message = unicode(e)
        if message == '':
            message = _('Oops, apologies - there was some error')
        response_data['message'] = message
        response_data['status'] = 'error'
        data = simplejson.dumps(response_data)
        return HttpResponse(data, mimetype="application/json")

@csrf_exempt
def remove_tag_from_category(request):
    """
    Remove a tag from a category it tag belongs to. Meant to be called using ajax
    and POST HTTP method. Available to admin and moderators users.
    The expected json request is an object with the following keys:
      'tag_name': name of the tag.
      'cat_id': ID of the category.
    The response is also a json object with keys:
      'status': Can be either 'success', 'noop' or 'error'
      'message': Text description in case of failure (not always present)

    Category IDs are the Django integer PKs of the respective model instances.
    """
    if not settings.ENABLE_CATEGORIES:
        raise Http404
    response_data = dict()
    try:
        if request.is_ajax():
            if request.method == 'POST':
                if request.user.is_authenticated():
                    if user_is_super_or_staff(request.user):
                        tag_name = request.POST.get('tag_name')
                        cat_id = request.POST.get('cat_id')
                        if not tag_name or cat_id is None:
                            raise exceptions.ValidationError(
                                _("Missing required parameter")
                                )
                        # TODO: there is a chance of a race condition here
                        try:
                            cat = Category.objects.get(id=cat_id)
                        except Category.DoesNotExist:
                            raise exceptions.ValidationError(
                                _("Requested category doesn't exist")
                                )
                        try:
                            tag_category = TagCategory.objects.get(category = cat, tag__name=tag_name)
                            tag_category.delete()
                            response_data['status'] = 'success'
                        except TagCategory.DoesNotExist:
                            response_data['status'] = 'noop'
                        data = simplejson.dumps(response_data)
                        return HttpResponse(data, mimetype="application/json")
                    else:
                        raise exceptions.PermissionDenied(
                            _('Sorry, but you cannot access this view')
                        )
                else:
                    raise exceptions.PermissionDenied(
                        _('Sorry, but anonymous users cannot access this view')
                    )
            else:
                raise exceptions.PermissionDenied('must use POST request')
        else:
            #todo: show error page but no-one is likely to get here
            return HttpResponseRedirect(reverse('index'))
    except Exception, e:
        message = unicode(e)
        if message == '':
            message = _('Oops, apologies - there was some error')
        response_data['message'] = message
        response_data['status'] = 'error'
        data = simplejson.dumps(response_data)
        return HttpResponse(data, mimetype="application/json")

@admin_ajax_post
def delete_category(request):
    """
    Remove a category. Meant to be called by the site administrator using ajax
    and POST HTTP method.
    The expected json request is an object with the following key:
      'id': ID of the category to be renamed.
      'token': A category deletion token obtained form a previous call (optional)
    The response is also a json object with keys:
      'status': Can be either 'success', 'need_confirmation',
                'cannot_delete_subcategories' or 'error'
      'message': Text description in case of failure (not always present)
      'token': A category deletion token that should be used to confirm the
               operation (not always present)

    Category IDs are the Django integer PKs of the respective model instances.

    When a category that is associated with one or more tags the view returns
    a 'status' of 'need_confirmation' and provides a 'tags' response key with
    a list of such tags and 'token' response key whose value can ve used in a
    new call to delete the same category object.

    Tokens are opaque strings with a maximum length of 20 and with a validity
    lifetime of ten minutes.
    """
    response_data = dict()
    cat_id = request.POST.get('id')
    if not cat_id:
        raise exceptions.ValidationError(
            _("Missing or invalid required parameter")
            )
    try:
        node = Category.objects.get(id=cat_id)
    except Category.DoesNotExist:
        raise exceptions.ValidationError(
            _("Requested category doesn't exist")
            )
    token = request.POST.get('token')
    if token is not None:
        # verify token + Category instance combination
        if not CategoriesApiTokenGenerator().check_token(node, token):
            raise exceptions.ValidationError(
                _("Invalid token provided")
                )

    tag_count = node.tagcategory_set.count()
    has_children = not node.is_leaf_node()
    if not tag_count and not has_children:
        # Let any exception that happens during deletion bubble up
        node.delete()
        response_data['status'] = 'success'
    elif has_children:
        response_data['status'] = 'cannot_delete_subcategories'
    elif tag_count:
        if token is None:
            response_data['status'] = 'need_confirmation'
            response_data['token'] = CategoriesApiTokenGenerator().make_token(node)
            #here!!!
            response_data['tags'] = [t[0] for t in TAG.objects.filter(tagcategory__category = node).values_list('name')]
        else:
            # Let any exception that happens during deletion bubble up
            node.tagcategory_set.clear()
            node.delete()
            response_data['status'] = 'success'
    data = simplejson.dumps(response_data)
    return HttpResponse(data, mimetype="application/json")

def get_categories(request):
    """
    Client-side autocomplete helper view.
    Get a listing of all categories. Meant to be called using ajax and GET HTTP
    method. Available to the admin user only.
    JSON request: N/A
    response: 'text/plain' list of lines with format '<cat name>|<cat_id>'
    """
    # TODO: How should we report errors to the client? using text? JSON?
    if not settings.ENABLE_CATEGORIES:
        raise Http404
    if request.method != 'GET':
        return HttpResponseNotAllowed(['GET'])
    if not request.user.is_authenticated():
        return HttpResponseForbidden(
            _('Sorry, but anonymous users cannot access this view')
        )
    if not user_is_super_or_staff(request.user):
        return HttpResponseForbidden(
            _('Sorry, but you cannot access this view')
        )
    if not request.is_ajax():
        return HttpResponseForbidden(
            _('Sorry, but you cannot access this view')
        )
    response = HttpResponse(mimetype="text/plain")
    vqs = Category.objects.order_by('name').values('name', 'id')
    for vdict in vqs:
        response.write('%(name)s|%(id)d\n' % vdict)
    return response
