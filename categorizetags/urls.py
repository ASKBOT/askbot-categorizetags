"""
askbot askbot url configuraion file
"""
from django.conf.urls.defaults import url, patterns
from django.conf.urls.defaults import handler500, handler404
from django.contrib import admin

admin.autodiscover()
urlpatterns = patterns('',
    url(#ajax only
        r'^add_category/$',
        'categorizetags.views.add_category',
        name='add_category'
    ),
    url(#ajax only
        r'^rename_category/$',
        'categorizetags.views.rename_category',
        name='rename_category'
    ),
    url(#ajax only
        r'^add_tag_to_category/$',
        'categorizetags.views.add_tag_to_category',
        name='add_tag_to_category'
    ),
    url(#ajax only
        r'^get_tag_categories/$',
        'categorizetags.views.get_tag_categories',
        name='get_tag_categories'
    ),
    url(#ajax only
        r'^remove_tag_from_category/$',
        'categorizetags.views.remove_tag_from_category',
        name='remove_tag_from_category'
    ),
    url(#ajax only
        r'^delete_category/$',
        'categorizetags.views.delete_category',
        name='delete_category'
    ),
    url(#ajax only
        r'^categories_list/$',
        'categorizetags.views.get_categories',
        name='categories_list'
    ),
)
