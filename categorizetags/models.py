"""utility functions for the use by 
the Category functionality"""
from django.db import models
from categories.models import Category
from mptt.templatetags.mptt_tags import cache_tree_children
from django.conf import settings
tmp = __import__(settings.TAG_MODEL_MODULE, globals(), locals(), ['Tag'], -1)
TAG = tmp.Tag

def generate_tree():
    """
    Traverses a node tree and builds a structure easily serializable as JSON.
    """
    roots = cache_tree_children(Category.tree.all())
    if roots:
        # Assume we have one tree for now, this could change if we decide
        # against storing the root node in the DB
        return _recurse_tree(roots[0])
    return {}

def _recurse_tree(node):
    """
    Helper recursive function for generate_tree().
    Traverses recursively the node tree.
    """
    output = {'name': node.name, 'id': node.id}
    children = []
    if not node.is_leaf_node():
        for child in node.get_children():
            children.append(_recurse_tree(child))
    output['children'] = children
    return output

class TagCategory(models.Model):
    global TAG
    tag = models.ForeignKey(TAG)
    category = models.ForeignKey(Category)

    class Meta:
        unique_together = ('tag', 'category')
