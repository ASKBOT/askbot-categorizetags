import ez_setup
ez_setup.use_setuptools()
from setuptools import setup, find_packages
import sys

setup(
    name = "categorizetags",
    version = '0.0.1',
    description = 'A Django application created for askbot project to categorize tags',
    packages = find_packages(),
    author = 'Evgeny.Fadeev, Ramiro Morales',
    author_email = 'evgeny.fadeev@gmail.com',
    license = 'BSD License',
    keywords = 'follow, database, django',
    url = 'https://github.com/ASKBOT/django-categorizetags',
    install_requires = ('django-mptt', 'django-categories',),
    include_package_data = True,
    classifiers = [
        'Development Status :: 4 - Beta',
        'Environment :: Web Environment',
        'Framework :: Django',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: BSD License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 2.4',
        'Programming Language :: Python :: 2.5',
        'Programming Language :: Python :: 2.6',
        'Programming Language :: JavaScript',
        'Topic :: Internet :: WWW/HTTP :: WSGI :: Application',
    ],
    long_description = """The ``categorizetags` django app allows to categorize
tags in askbot forum, the app is only experimental."""
)
