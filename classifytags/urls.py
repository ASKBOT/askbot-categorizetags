"""
askbot askbot url configuraion file
"""
from django.conf.urls.defaults import url, patterns
from django.conf.urls.defaults import handler500, handler404
from django.contrib import admin
from classifytags import views

admin.autodiscover()
urlpatterns = patterns('',
    url(#ajax only
        r'^add_category/$',
        views.add_category,
        name='add_category'
    ),
    url(#ajax only
        r'^rename_category/$',
        views.rename_category,
        name='rename_category'
    ),
    url(#ajax only
        r'^add_tag_to_category/$',
        views.add_tag_to_category,
        name='add_tag_to_category'
    ),
    url(#ajax only
        r'^get_tag_categories/$',
        views.get_tag_categories,
        name='get_tag_categories'
    ),
    url(#ajax only
        r'^remove_tag_from_category/$',
        views.remove_tag_from_category,
        name='remove_tag_from_category'
    ),
    url(#ajax only
        r'^delete_category/$',
        views.delete_category,
        name='delete_category'
    ),
    url(#ajax only
        r'^categories_list/$',
        views.get_categories,
        name='categories_list'
    ),
)
