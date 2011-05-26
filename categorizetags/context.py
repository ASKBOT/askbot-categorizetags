"""Template context processor for askbot's categorizetags app
"""

def categorizetags_context(request):
    """The context processor function"""
    from django.utils import simplejson
    from categorizetags.models import generate_tree
    return {
        'cats_tree': simplejson.dumps(generate_tree()),
        'current_category': request.session.get('current_category', None)
    }
