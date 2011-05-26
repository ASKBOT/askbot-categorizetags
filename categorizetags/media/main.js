/**
 * removes first occurance of item in array
 */
var arrayRemove = function(arr, item){
    for (var i = 0; i < arr.length; i++){
        if (arr[i] === item){
            arr.splice(i, 1);
            return;
        }
    }
};

/**
 * kind of like Python's builtin getattr
 * @param {Object} obj
 * @param {string} key
 * @param {*} default_value
 */
var getattr = function(obj, key, default_value){
    if (obj){
        return (key in obj) ? obj[key] : default_value;
    } else {
        return default_value;
    }
};

var makeKeyHandler = function(key, callback){
    return function(e){
        if ((e.which && e.which == key) || (e.keyCode && e.keyCode == key)){
            callback(e);
            e.stopImmediatePropagation();
        }
    };
};


var setupButtonEventHandlers = function(button, callback){
    var wrapped_callback = function(e){
        callback();
        e.stopImmediatePropagation();
    };
    button.keydown(makeKeyHandler(13, wrapped_callback));
    button.click(wrapped_callback);
};

/* some google closure-like code for the ui elements */
var inherits = function(childCtor, parentCtor) {
  /** @constructor taken from google closure */
    function tempCtor() {};
    tempCtor.prototype = parentCtor.prototype;
    childCtor.superClass_ = parentCtor.prototype;
    childCtor.prototype = new tempCtor();
    childCtor.prototype.constructor = childCtor;
};

/* wrapper around jQuery object */
var WrappedElement = function(){
    this._element = null;
    /**
     * @private
     * @type {boolean}
     */
    this._in_document = false;
    /**
     * @private
     * @type {Array.<string>}
     */
    this._css_classes = [];
    /**
     * @private
     * @type {string}
     */
    this._html_tag = 'div';
};
WrappedElement.prototype.setElement = function(element){
    this._element = element;
};
WrappedElement.prototype.setHtmlTag = function(html_tag){
    this._html_tag = html_tag;
};
/**
 * @param {string} css_class
 */
WrappedElement.prototype.addClass = function(css_class){
    if ($.inArray(css_class, this._css_classes) > -1){
        return;
    } else {
        this._css_classes.push(css_class);
        if (this._element){
            this._element.addClass(css_class);
        }
    }
};
/**
 * @param {css_class}
 */
WrappedElement.prototype.removeClass = function(css_class){
    if ($.inArray(css_class, this._css_classes) > 1){
        arrayRemove(this._css_classes, css_class);
        if (this._element){
            this._element.removeClass(css_class);
        }
    }
};
WrappedElement.prototype.setCssClasses = function(){
    if (this._css_classes){
        var element = this.getElement();
        $.each(this._css_classes, function(idx, css_class){
            element.addClass(css_class);
        });
    }
};
WrappedElement.prototype.createDom = function(){
    this._element = this.makeElement(this._html_tag);
    if (this._css_classes.length > 0){
        var element = this._element;
        $.each(this._css_classes, function(idx, css_class){
            element.addClass(css_class);
        });
    }
};
WrappedElement.prototype.getElement = function(){
    if (this._element === null){
        this.createDom();
    }
    return this._element;
};
/**
 * @param {Array.<string>} events
 * event names must be real - no error checking
 */
WrappedElement.prototype.stopEventPropagation = function(events){
    var elem = this.getElement();
    $.each(events, function(idx, event_name){
        elem[event_name](function(e){
            e.stopImmediatePropagation();
        });
    });
};
WrappedElement.prototype.inDocument = function(){
    return this._in_document;
};
WrappedElement.prototype.enterDocument = function(){
    return this._in_document = true;
};
WrappedElement.prototype.hasElement = function(){
    return (this._element !== null);
};
WrappedElement.prototype.makeElement = function(html_tag){
    //makes jQuery element with tags
    return $('<' + html_tag + '></' + html_tag + '>');
};
WrappedElement.prototype.dispose = function(){
    if (this._element){
        this._element.remove();
    }
    this._in_document = false;
};

var ClearDiv = function(){
    WrappedElement.call(this);
};
inherits(ClearDiv, WrappedElement);
ClearDiv.prototype.createDom = function(){
    ClearDiv.superClass_.createDom.call(this);
    this._element.css('clear', 'both');
    this._element.css('height', 0);
};

/**
 * container thing
 * @constructor
 * @extends {WrappedElement}
 * @param {string} html_tag
 */
var Container = function(html_tag){
    WrappedElement.call(this);
    /**
     * @private
     * @type {string}
     */
    this._html_tag = html_tag ? html_tag : 'div';

    /**
     * @private
     * @type {Array.<WrappedElement>}
     */
    this._children = [];
};
inherits(Container, WrappedElement);
/**
 * @param {boolean}
 */
Container.prototype.isEmpty = function(){
    return this._children.length === 0;
};
Container.prototype.empty = function(){
    $.each(this._children, function(idx, child){
        child.dispose();
    });
    if (this._element){
        this._element.empty();
    }
    this._children = [];
};
Container.prototype.dispose = function(){
    this.empty();
    Container.superClass_.dispose.call(this);

};
/**
 * @param {WrappedElement} content
 * no check that the element is not in children already
 */
Container.prototype.addContent = function(content){
    this._children.push(content);
    if (this._element){
        this._element.append(content.getElement());
    }
};
/**
 * @param {WrappedElement} content
 * @param {boolean} dispose
 */
Container.prototype.removeContent = function(content){
    for (var i = 0; i < this._children.length; i++){
        if (this._children[i] === content){
            this._children.splice(i, 1);
            content.dispose();
            return;
        }
    }
};
Container.prototype.createDom = function(){
    Container.superClass_.createDom.call(this);
    var me = this;
    $.each(this._children, function(idx, child){
        me.getElement().append(child.getElement());
    });
};

/**
 * @constructor
 */
var Span = function(text){
    WrappedElement.call(this);
    this._text = text;
    this._html_tag = 'span';
};
inherits(Span, WrappedElement);

Span.prototype.createDom = function(){
    Span.superClass_.createDom.call(this);
    this._element.html(this._text);
};

/**
 * @constructor
 * a wrapped jquery element that has state
 */
var Widget = function(){
    WrappedElement.call(this);
    /**
     * @private
     * @type {Object.<string, Function>}
     * "dictionary" of transition state event handlers
     * where keys are names of the states to which 
     * the widget is transitioning
     * and the values are functions are to be called upon
     * the transitions
     */
    this._state_transition_event_handlers = {};
    /** 
     * @private
     * @type {string}
     * internal state of the widget
     */
    this._state = null;
};
inherits(Widget, WrappedElement);

Widget.prototype.getStateTransitionEventHandlers = function(){
    return this._state_transition_event_handlers;
};

/**
 * @param {Widget} other_widget
 * not a careful method, will overwrite all
 */
Widget.prototype.copyStateTransitionEventHandlersFrom = function(other_widget){
    this._state_transition_event_handlers =
        other_widget.getStateTransitionEventHandlers();
};
/**
 * @private
 */
Widget.prototype.backupStateTransitionEventHandlers = function(){
    this._steh_backup = this._state_transition_event_handlers;
};
/**
 * @private
 */
Widget.prototype.restoreStateTransitionEventHandlers = function(){
    this._state_transition_event_handlers = this._steh_backup;
};
/**
 * @param {string} state
 */
Widget.prototype.setState = function(state){
    this._state = state;
};
/**
 * @return {sting} state
 */
Widget.prototype.getState = function(){
    return this._state;
};

/**
 * @param {Object}
 */
Widget.prototype.setStateTransitionEventHandlers = function(handlers){
    this._state_transition_event_handlers = handlers;
};

/**
 * the "loader" widget,
 * shows the user that something is going on
 * @constructor
 * @extends {Widget}
 * supports states: ON, OFF
 */
var Loader = function(){
    Widget.call(this);
    /**
     * @private
     * @type {string}
     */
    this._text = gettext('Loading');
    /**
     * @private
     * @type {number}
     */
    this._tic_delay = 250;
    /**
     * @private
     * @type {number}
     */
    this._tic_counter = 0;
    /**
     * @private
     * @type {number}
     */
    this._max_tics = 4;

    /**
     * @private
     * @type {string}
     */
    this._tic_symbol = '.';

    /**
     * @private
     * @type {?number}
     * tic interval
     */
    this._interval = null;
};
inherits(Loader, Widget);

Loader.prototype.createDom = function(){
    this._element = this.makeElement('div');
    this._element.addClass('loader');
};

Loader.prototype.dispose = function(){
    this.stop();
    Loader.superClass_.dispose.call(this);
};

Loader.prototype.run = function(){
    if (this.getState() === 'ON'){
        return;
    }
    var me = this;
    this.getElement().html(this._text);
    this._interval = setInterval(
        function(){ me.tic(); },
        this._tic_delay
    );
    this.setState('ON');
};

Loader.prototype.stop = function(){
    if (this.getState() === 'OFF'){
        return;
    }
    clearInterval(this._interval);
    this.setState('OFF');
};

/** refresh the loader */
Loader.prototype.tic = function(){
    if (this._tic_counter === this._max_tics){
        this._tic_counter = 0;
    }
    var text = this._text;
    for (var i = 0; i < this._tic_counter; i++){
        text += this._tic_symbol;
    }
    this.getElement().html(text);
    this._tic_counter += 1;
};

var SimpleControl = function(){
    WrappedElement.call(this);
    this._handler = null;
    this._title = null;
};
inherits(SimpleControl, WrappedElement);

SimpleControl.prototype.setHandler = function(handler){
    this._handler = handler;
    if (this.hasElement()){
        this.setHandlerInternal();
    }
};

SimpleControl.prototype.setHandlerInternal = function(){
    //default internal setHandler behavior
    setupButtonEventHandlers(this._element, this._handler);
};

SimpleControl.prototype.setTitle = function(title){
    this._title = title;
};

/**
 * A clickable icon
 * @constructor
 * @param {string} icon_class - class name for the icon
 * @param {string} title - to become "title" attribute
 */
var ActionIcon = function(icon_class, title){
    SimpleControl.call(this);
    this._class = icon_class;
    this._title = title
};
inherits(ActionIcon, SimpleControl);
/**
 * @private
 */
ActionIcon.prototype.createDom = function(){
    this._element = this.makeElement('span');
    this.decorate(this._element);
};
/**
 * @param {Object} element
 */
ActionIcon.prototype.decorate = function(element){
    this._element = element;
    this._element.addClass(this._class);
    this._element.attr('title', this._title);
    if (this._handler !== null){
        this.setHandlerInternal();
    }
};

var EditLink = function(){
    SimpleControl.call(this)
};
inherits(EditLink, SimpleControl);

EditLink.prototype.createDom = function(){
    var element = $('<a></a>');
    element.addClass('edit');
    this.decorate(element);
};

EditLink.prototype.decorate = function(element){
    this._element = element;
    this._element.attr('title', $.i18n._('click to edit this comment'));
    this._element.html($.i18n._('edit'));
    this.setHandlerInternal();
};

/**
 * @constructor
 * @param {string} title
 */
var DeleteIcon = function(title){
    ActionIcon.call(this, 'delete-icon', title);
};
inherits(DeleteIcon, ActionIcon);

var AdderIcon = function(title){
    ActionIcon.call(this, 'adder-icon', title);
};
inherits(AdderIcon, ActionIcon);

//custom autocompleter

/**
 * A text element with an "edit" prompt
 * showing on mouseover
 * the widget has two states: DISPLAY and "EDIT"
 * when user hits "edit", widget state changes to
 * EDIT, when user hits "enter" state goes to "DISPLAY
 * replaced with an input box and the "edit" link
 * hides
 * when user hits "enter", 
 */
var EditableString = function(){
    Widget.call(this);
    /**
     * @private
     * @type {string}
     * text string that is to be shown 
     * to the user
     */
    this._text = '';

    /**
     * @private
     * @type {boolean}
     */
    this._is_editable = true;
    /**
     * @private
     * @type {string}
     * supported states are 'DISPLAY' and 'EDIT'
     * 'DISPLAY' is default
     */
    this._state = 'DISPLAY';
};
inherits(EditableString, Widget);

/**
 * @param {boolean} is_editable
 */
EditableString.prototype.setEditable = function(is_editable){
    this._is_editable = is_editable;
};

/**
 * @param {boolean}
 */
EditableString.prototype.isEditable = function(){
    return this._is_editable;
};

/**
 * @return {Object}
 */
EditableString.prototype.getDisplayBlock = function(){
    return this._display_block;
};
/**
 * @return {Object}
 */
EditableString.prototype.getEditBlock = function(){
    return this._edit_block;
};

EditableString.prototype.setState = function(state){
    if (state === 'EDIT' && this.isEditable() === false){
        throw 'cannot edit this instance of EditableString';
    }

    this._state = state;

    //run transition event handler, if exists
    var handlers = this.getStateTransitionEventHandlers();
    if (handlers.hasOwnProperty(state)){
        handlers[state].call();
    }

    if (! (this._display_block && this._edit_block) ){
        //a case when createDom has not yet been called
        return;
    }

    //hide and show things
    if (state === 'EDIT'){
        this._edit_block.show();
        this._input_box.focus();
        this._display_block.hide();
    } else if (state === 'DISPLAY'){
        this._edit_block.hide();
        this._display_block.show();
        if (this.isEditable()){
            this._edit_link.show();
        }
    }
};

/**
 * @param {string} text - string text
 */
EditableString.prototype.setText = function(text){
    this._text = text;
    if (this._text_element){
        this._text_element.html(text);
    };
};

/**
 * @return {string} text of the string
 */
EditableString.prototype.getText = function(){
    if (this._text_element){
        var text = $.trim(this._text_element.html());
        this._text = text;
        return text;
    } else {
        return $.trim(this._text);
    }
};

/**
 * @return {string}
 */
EditableString.prototype.getInputBoxText = function(){
    return $.trim(this._input_box.val());
};

EditableString.prototype.getSaveEditHandler = function(){
    var me = this;
    return function(){
        me.setText(me.getInputBoxText());
        me.setState('DISPLAY');
    };
};

EditableString.prototype.getStartEditHandler = function(){
    var me = this;
    return function(){
        me.setState('EDIT');
        me._input_box.val(me._text_element.html());
        me._input_box.focus();
    };
};

/**
 * takes an jQuery element, assumes (no error checking)
 * that the element
 * has a single text node and replaces its content with
 * <div><span>text</span><a>edit</a><div>
 * <div><input /></div>
 * and enters the DISPLAY state
 */
EditableString.prototype.decorate = function(element){
    this.setText(element.html());//no error checking
    //build dom for the display block
    var real_element = this.getElement();
    this._element = element;
    this._element.empty();
    this._element.append(real_element);
};

EditableString.prototype.createDom = function(){

    this._element = this.makeElement('div');

    this._display_block = this.makeElement('div');
    this._element.append(this._display_block);
    this._text_element = this.makeElement('span');
    this._display_block.append(this._text_element);
    //set the value of text
    this._text_element.html(this._text);
    //set the display state

    //it is assumed that _is_editable is set once at the beginning
    this._edit_block = this.makeElement('div');
    this._element.append(this._edit_block);

    this._input_box = this.makeElement('input');
    this._input_box.attr('type', 'text');
    this._edit_block.append(this._input_box);

    var edit_link = new EditLink();
    edit_link.setHandler(
        this.getStartEditHandler()
    );

    var edit_element = edit_link.getElement();
    if (!this.isEditable()){
        edit_element.hide();
    }
    this._display_block.append(edit_element);
    //build dom for the edit block

    this._edit_link = edit_link.getElement();

    this._input_box.keydown(
        makeKeyHandler(13, this.getSaveEditHandler())
    );
    this.setState(this.getState());
};

/**
 * Dropdown widget that creates itself on hover
 * over some element
 * a special behavior is that this dropdown is a singleton in dom
 * @constructor
 * @extends {Widget}
 */
var DropDown = function(){
    Widget.call(this);
    /**
     * @private
     * @type {?Object}
     * the parent element
     */
    this._parent_element = null;

    /**
     * @private
     * @type {?Widget}
     * the content widget
     */
    this._content = null;

    /**
     * @private
     * close timeout
     */
    this._close_timeout = null;

    /**
     * @private
     * @type {number}
     * menu closing delay, ms
     */
    this._close_delay = 200;

    /**
     * @private
     * @type {number}
     */
    this._pre_open_delay = 300;

    /**
     * @private
     * @type {number}
     */
    this._open_think_delay = 300;

    /**
     * @private
     * @type {boolean}
     */
    this._is_frozen = false;
    /**
     * @private
     * extra css class
     */
    this._css_class;
};
inherits(DropDown, Widget);

/**
 * @param {Object} parent_element
 */
DropDown.prototype.setParentElement = function(parent_element){
    this._parent_element = parent_element;
};

/**
 * @param {string} css_class
 */
DropDown.prototype.setCssClass = function(css_class){
    this._css_class = css_class;
};

/**
 * @param {Widget} content
 */
DropDown.prototype.setContent = function(content){
    this._content = content;
};

/**
 * @return {Widget}
 */
DropDown.prototype.getContent = function(){
    return this._content;
};

/** override me */
DropDown.prototype.onOpen = function(){
};
/** override me */
DropDown.prototype.onClose = function(){
};
/** override if it is necessary to
 * do something before opening the menu
 * @param {Function} on_open
 */
DropDown.prototype.beforeOpen = function(on_open){
    on_open();
}

/**
 * @param {Object} parent_element jQuery object
 * to attach the dropdown to
 */
DropDown.prototype.decorate = function(parent_element){
    this.setParentElement(parent_element);
    var me = this;
    var parent_element = this._parent_element;
    parent_element.mouseover(function(){ me.scheduleOpening() });
    parent_element.mouseout(function(){ me.scheduleClosing() });
};

/**
 * @private
 */
DropDown.prototype.createDom = function(){
    //try getting an element from dom
    var element = $('#ab-drop-down');
    if (element.length === 0){
        element = this.makeElement('div');
        element.attr('id', 'ab-drop-down');
        $('body').append(element);
    } else {
        this.reset();
    }
    if (this._css_class){
        element.addClass(this._css_class);
    }
    this._element = element;
    this._element.css('position', 'absolute').hide();

    var content = this.getContent();
    this._element.append(content.getElement());

    var me = this;
    this._element.mouseleave(function(){ me.close(); });
    this._element.mouseenter(function(){ me.stopClosing() });
    this.stopEventPropagation(['click']);

    $(document).click(function(){
        me.unfreeze();
        me.close();
    });
};
/**
 * freezes the menu - so it does not collapse
 * until "unfrozen"
 */
DropDown.prototype.freeze = function(){
    //use a private attribute...
    this._is_frozen = true;
};
DropDown.prototype.unfreeze = function(){
    this._is_frozen = false;
};
/**
 * opens the dropdown
 */
DropDown.prototype.open = function(){
    if (this.getState() !== 'OPEN'){
        this.createDom();
        var parent_element = this._parent_element;
        this._element.show();
        this._element.position({
            my: 'left top',
            at: 'left bottom',
            of: parent_element,
        });
        //this.getContent().getElement().show();
        this.setState('OPEN');
    }
    this.onOpen();
};
/**
 * sets timeout to open the menu
 */
DropDown.prototype.scheduleOpening = function(){
    if (this._is_frozen){
        return;
    }
    if (this._pre_open_delay > 0){
        var me = this;
        var delay = this._pre_open_delay;
        var start = function(){ me.startOpening(); };
        this._start_opening_timeout = setTimeout(start, delay);
    } else {
        this.open();
    }
};
/**
 * sets the timeout to close the dropdown
 */
DropDown.prototype.scheduleClosing = function(){
    if (this._is_frozen){
        return;
    }
    clearTimeout(this._start_opening_timeout);//stop opening too
    var me = this;
    this._close_timeout = setTimeout(
        function(){ me.close() },
        me._close_delay
    );
};
DropDown.prototype.startLoader = function(){
    var content = this.getContent();

    var loader = new Loader();
    content.addContent(loader);
    loader.run();

    this._loader = loader;
};
DropDown.prototype.stopLoader = function(){
    if (this._loader){
        var content = this.getContent();
        content.removeContent(this._loader);
    }
};
DropDown.prototype.startOpening = function(){
    var me = this;
    var check = function(){
        if (me.getState() !== 'OPEN'){
            me.open();
            me.startLoader();
        }
    };
    setTimeout(check, this._open_think_delay);
    var on_open = function(){
        me.open();
        me.stopLoader();
    };
    this.beforeOpen(on_open);
};
/**
 * clears the close timeout
 */
DropDown.prototype.stopClosing = function(){
    clearTimeout(this._close_timeout);
    this._close_timeout = null;
};
/**
 * empties contents of the menu
 * and hides the element
 */
DropDown.prototype.reset = function(){
    if (this._element){
        this._element.hide();
        if (this._content){
            this.getContent().dispose();
        }
        this._content = null;
        this._element.empty();
    }
};
/**
 * closes the menu
 */
DropDown.prototype.close = function(){
    if (this._is_frozen){
        console.log('frozen');
        return;
    }
    console.log('not frozen');
    this.onClose();
    this.reset();
    this.setState('CLOSED');
};

/**
 * a utility function, converts the category tree
 * data into a list usable by the category autocompleter
 * with an assumption that items in the tree are all unique
 * @param {CategoryData} tree_data
 */
flattenCategoryData = function(tree_data){
    var cat_list = [];
    $.each(tree_data, function(idx, child){
        cat_list.push({value: child['name'], data: [child['id']]});
        var flat_child_data = flattenCategoryData(child['children']);
        cat_list.push.apply(cat_list, flat_child_data);
    });
    return cat_list;
};


/**
 * @constructor
 * @inherits {EditableString}
 */
var Category = function(){
    EditableString.call(this);
    /** 
     * @private
     * @type {?number}
     */
    this._category_id = null;
    /**
     * @private
     * @type {?Category}
     * parent category, if any
     */
    this._parent = null;
}
inherits(Category, EditableString);

/**
 * @param {number} id
 * set caterory id
 */
Category.prototype.setId = function(id){
    this._category_id = id;
};
/**
 * @return {number}
 */
Category.prototype.getId = function(){
    return this._category_id;
};
/**
 * @return boolean
 */
Category.prototype.hasId = function(){
    return (this._category_id !== null);
};
/**
 * @param {Category} parent_category
 */
Category.prototype.setParent = function(parent_category){
    this._parent = parent_category;
};
/**
 * @returns {?Category}
 */
Category.prototype.getParent = function(){
    return this._parent;
};

/**
 * @param {string} name
 * set category name
 */
Category.prototype.setName = function(name){
    this.setText(name);
};

/**
 * @return {?string}
 */
Category.prototype.getName = function(){
    return this.getText();
};

/**
 * override of the parent classes getter
 * @return {Function}
 */
Category.prototype.getSaveEditHandler = function(){
    var me = this;
    if (this.hasId()){
        return function(){
            me.startRenaming();
        }
    } else {
        return function(){
            me.startAddingToDatabase();
        };
    }
};

/**
 * @private
 */
Category.prototype.startRenaming = function(){
    var new_name = this.getInputBoxText();
    var old_name = this.getText();
    if (new_name !== '' && new_name !== old_name){
        var me = this;
        var success_handler = function(){
            me.setText(new_name);
            me.setState('DISPLAY');
        };
        $.ajax({
            type: 'POST',
            cache: false,
            dataType: 'json',
            url: askbot['urls']['rename_category'],
            data: {id: me.getId(), name: new_name},
            success: success_handler
        });
    }
};
/**
 * starts deleting a category from the database
 * @param {Function} on_delete - to be called after delete succeeds
 * @param {*=} token - confirmation token - do not use directly
 *
 * This function first retreives a token, asks user permission, then 
 * attempts to delete the category
 */
Category.prototype.startDeleting = function(on_delete, token){
    var data = {id: this.getId()};
    if (token){
        data['token'] = token;
    }
    var me = this;
    $.ajax({
        type: 'POST',
        cache: false,
        dataType: 'json',
        url: askbot['urls']['delete_category'],
        data: data,
        success: function(data, text_status, xhr){
            if (data['status'] === 'need_confirmation'){
                if (confirm(gettext('Sure you want to delete this category?'))){
                    me.startDeleting(on_delete, data['token']);//this time delete for sure
                }
            } else if (data['status'] === 'success'){
                on_delete();
            }
        }
    });
};

/**
 * @private
 */
Category.prototype.startAddingToDatabase = function(){
    var new_category_name = this.getInputBoxText();
    var data = {
        'parent': this.getParent().getId(),
        name: new_category_name 
    };
    var me = this;
    var success_handler = function(data, text_status, xhr){
        me.setText(new_category_name);
        me.setId(data['id']);
        me.setState('DISPLAY');
        me.becomeBonaFide();
    };
    $.ajax({
        type: 'POST',
        cache: false,
        dataType: 'json',
        url: askbot['urls']['add_category'],
        data: data,
        success: success_handler
    });
};

/**
 * @private
 * called when category becomes "real" after saving
 * in the database
 */
Category.prototype.becomeBonaFide = function(){
    this.restoreStateTransitionEventHandlers();
};

/**
 * @constructor
 * @param {MenuItem} parent_item
 */
var MenuAdder = function(parent_item){
    AdderIcon.call(this, gettext('Add subcategory'));
    /**
     * @private
     * @type {MenuItem}
     */
    this._parent_menu_item = parent_item;
};
inherits(MenuAdder, AdderIcon);
/**
 * @return {MenuItem}
 */
MenuAdder.prototype.getParentMenuItem = function(){
    return this._parent_menu_item;
};

/**
 * @typedef {{id: number, name: string}}
 */
var CategoryData;

/** 
 * the data structure used to construct the MenuItem
 * @typedef {{id: number, name: string, children: Array.<MenuData>}}
 */
var MenuItemData;

/**
 * the data structure for the entire menu
 * @typedef {{Array.<MenuItemData>}}
 */
var MenuData;


/**
 * MenuItem widget
 * @constructor
 * @param {Menu} parent_menu - the parent menu
 * @param {MenuItemData} data
 */
var MenuItem = function(parent_menu, data){
    Widget.call(this);
    /** 
     * MenuItem id
     * @type {?integer}
     */
    this.id = getattr(data, 'id', null);
    /**
     * MenuItem name
     * @type {?string}
     */
    this.name = getattr(data, 'id', null);
    /**
     * source data for the children
     * @private
     * @type {Object} 
     */
    this._children_data = getattr(data, 'children', []);
    /**
     * @private
     * @type {Menu}
     */
    this._parent_menu = parent_menu;
    /**
     * child menu item
     * @private
     * @type {Menu}
     */
    this._child_menu = null;
    /**
     * content element of the menu
     * @private
     * @type {Object} any class,
     * but method getText() is required
     */
    this._content = null;

};
inherits(MenuItem, WrappedElement);

/**
 * @param {Object} content - content object
 * any object with a method getText()
 */
MenuItem.prototype.setContent = function(content){
    this._content = content;
};

/**
 * @returns {Object}
 */
MenuItem.prototype.getContent = function(){
    return this._content;
};

/**
 * @returns {Menu}
 */
MenuItem.prototype.getParentMenu = function(){
    return this._parent_menu;
}

/**
 * @return {MenuItem}
 */
MenuItem.prototype.getParentMenuItem = function(){
    return this._parent_menu.getParentMenuItem();
};

/**
 * @private
 * @param {state} string
 * supported states are DISPLAY and EDIT
 */
MenuItem.prototype.setState = function(state){
    this._content.setState(state);
}

/**
 * @type {boolean}
 */
MenuItem.prototype.isEditable = function(){
    return this._parent_menu.isEditable();
};

/**
 * @return {boolean}
 */
MenuItem.prototype.hasChildren = function(){
    return (this._children_data && this._children_data.length > 0);
};

/**
 * @param {boolean} is_childless
 * changes the display in accordance with the new status
 */
MenuItem.prototype.setChildless = function(is_childless){
    var more_icon = this._more_icon;
    var menu_adder = this._menu_adder.getElement();
    if (is_childless){
        more_icon.hide();
        menu_adder.show();
    } else {
        more_icon.show();
        menu_adder.hide();
    }
};

/**
 * @param {boolean} is_deletable
 * changes the display
 */
MenuItem.prototype.setDeletable = function(is_deletable){
    if (is_deletable){
        this._delete_icon.getElement().show();
    } else {
        this._delete_icon.getElement().hide();
    }
};

/**
 * @private
 */
MenuItem.prototype.hideControls = function(){
    this._more_icon.hide();
    this._delete_icon.getElement().hide();
    this._menu_adder.getElement().hide();
};


/**
 * creates dom for a single MenuItem
 * does not build subcategories
 */
MenuItem.prototype.createDom = function(){
    //create the text element for MenuItem
    this._element = this.makeElement('li');
    this._element.addClass('menu-item');
    this._element.append(this.getContent().getElement());

    var disp_block = this.getContent().getDisplayBlock();

    //todo: may become a widget
    var more_icon = this.makeElement('span');
    more_icon.addClass('go-right-icon');
    disp_block.append(more_icon);
    this._more_icon = more_icon;
    var deleter = new DeleteIcon();
    this._delete_icon = deleter;
    var me = this;
    var on_delete = function(){
        me.finishDeleting();
    }
    deleter.setHandler(function(){
        me.startDeleting(on_delete);
    });
    disp_block.append(deleter.getElement());

    /* todo: add check on the current menu level
     * if it is maxed out - do not add the MenuAdder
     */
    var menu_adder = new MenuAdder(this);
    menu_adder.setHandler(function(){ me.startAddingSubmenu() });

    this._menu_adder = menu_adder;
    disp_block.append(menu_adder.getElement());

    this.hideControls();

    if (this.hasChildren()){
        this.setChildless(false);
    } else {
        if (this.isEditable()){
            this.setDeletable(true);
            this.setChildless(true);
        }
    }

    //todo: copy state transition event handlers to the EditableText
    //add delete handler and button - if user has privilege to delete
    var me = this;
    this._element.mouseover(function(e){me.focusOnMe(e)});
    this._element.mouseout(function(e){me.startLosingFocusOnMe(e)});
    this.getContent().getElement().mouseover(function(e){me.stopLosingFocusOnMe(e)});
};

MenuItem.prototype.startAddingSubmenu = function(){
    //build an empty subtree on the current menu item
    var new_menu = this.buildSubtree();
    new_menu.open();
    //activate the menu item adder on the new menu
    new_menu.getMenuItemAdder().activate();
};

/**
 * @private
 * @param {Function} on_delete callback
 * starts deleting the menu item with attempting to
 * remove content - potentially entailing an ajax request
 */
MenuItem.prototype.startDeleting = function(on_delete){
    this.getContent().startDeleting(on_delete);
};

/**
 * @private
 * finalizes deletion of the menu item
 * if the item was last on the menu and the menu is not top-level
 * the parent menu item will need to be adjusted to allow
 * creation of a subtree and the parent menu is destroyed
 */
MenuItem.prototype.finishDeleting = function(){
    var menu = this._parent_menu;
    menu.removeMenuItem(this);
    if (menu.isEmpty() && (!menu.isRoot())){
        var parent_item = this.getParentMenuItem();
        parent_item.setChildless(true);
        parent_item.setDeletable(true);
        menu.dispose();
    }
    this.dispose();
};

/**
 * @param {MenuItem} child_item
 * this is called from Menu.removeMenuItem
 * due to double data storage about children
 */
MenuItem.prototype.removeChildMenuItem = function(child_item){
    for (var i = 0; i < this._children_data; i++){
        if (this._children_data[i]['name'] === childItem.getContent().getName()){
            this._children_data.splice(i, 1);
            return;
        }
    }
};

/**
 * destroys the menu item
 */
MenuItem.prototype.dispose = function(){
    this.getContent().dispose();
    this._element.remove();
    if (this._more_icon){
        this._more_icon.remove();
    }
    if (this._delete_icon){
        this._delete_icon.dispose();
    }
    if (this._menu_adder){
        this._menu_adder.dispose();
    }
    if (this._child_menu){
        this._child_menu.dispose();
    }
};

/**
 * stops closing of the parent menu, if closure is scheduled
 * closes all child menues of the parent menu
 * opens own child menu, if exists
 */
MenuItem.prototype.focusOnMe = function(e){
    var parent_menu = this._parent_menu;
    parent_menu.stopClosingAll();
    parent_menu.closeChildren();
    parent_menu.setActiveItem(this);
    this.openChildMenu();
    e.stopImmediatePropagation();
};

/** sets the timer to close child menues */
MenuItem.prototype.startLosingFocusOnMe = function(e){
    this._parent_menu.startClosing();
    this.deactivate();
    e.stopImmediatePropagation();
};

/** cancels the timer for closing the child menues */
MenuItem.prototype.stopLosingFocusOnMe = function(e){
    this._parent_menu.stopClosingAll();
};

/** opens the child menu if it is there */
MenuItem.prototype.openChildMenu = function(){
    if (this._child_menu){
        this._child_menu.open();
    }
};

/** closes child menu, if exists */
MenuItem.prototype.closeChildMenu = function(){
    if (this._child_menu){
        this._child_menu.close();
    }
}

MenuItem.prototype.activate = function(){
    this._element.addClass('active-menu-item');
};

MenuItem.prototype.deactivate = function(){
    this._element.removeClass('active-menu-item');
};

/**
 * Initializes child_menus and treir DOM's
 * @return {?Menu}
 */
MenuItem.prototype.buildSubtree = function(){
    var child_menu = this._parent_menu.createChild();
    child_menu.setData(this._children_data);
    var child_menu_element = child_menu.getElement();
    this.getElement().append(child_menu_element);

    child_menu.setParentContentItem(this.getContent());
    child_menu.setParentMenuItem(this);

    this._child_menu = child_menu;
    return child_menu;
};

/**
 * @constructor
 * @param {Menu} parent_menu - owner of the adder instance
 * creates a menu item widget
 */
var MenuItemAdder = function(parent_menu){
    Widget.call(this);
    /**
     * @private
     * @type {string}
     * the link message
     */
    this._text = gettext('Add new item');
    /**
     * @private
     * @type {Menu}
     */
    this._parent_menu = parent_menu;

};
inherits(MenuItemAdder, Widget);
/**
 * @param {Function} func the content item creator function
 */
MenuItemAdder.prototype.setContentItemCreator = function(func){
    this._content_item_creator = func;
};
/**
 * @param {string} text - link text
 */
MenuItemAdder.prototype.setText = function(text){
    this._text = text;
};
/** @private */
MenuItemAdder.prototype.createDom = function(){
    var li = this.makeElement('li');
    var link = this.makeElement('a');
    link.html(this._text);
    this._button = link;

    var me = this;
    setupButtonEventHandlers(link, function(){ me.startAddingItem() });

    li.append(link);
    this._element = li;

    /* similar event handlers to MenuItem - to prevent
    premature closing of the menu */
    this._element.mouseover(function(e){ me.focusOnMe(e) });
    this._element.mouseout(function(e){ me.startLosingFocusOnMe(e) });
    link.mouseover(function(e){ me.stopLosingFocusOnMe(e) });
};
/**
 * stops closing of the parent menu, if closure is scheduled
 * closes all child menues of the parent menu
 * opens own child menu, if exists
 */
MenuItemAdder.prototype.focusOnMe = function(e){
    var parent_menu = this._parent_menu;
    parent_menu.stopClosingAll();
    //parent_menu.setActiveItem(this);//should be null
    e.stopImmediatePropagation();
};

/** sets the timer to close child menues */
MenuItemAdder.prototype.startLosingFocusOnMe = function(e){
    this._parent_menu.startClosing();
    e.stopImmediatePropagation();
};

/** cancels the timer for closing the child menues */
MenuItemAdder.prototype.stopLosingFocusOnMe = function(e){
    this._parent_menu.stopClosingAll();
};

MenuItemAdder.prototype.activate = function(){
    this._button.click();
};
/**
 * @private
 */
MenuItemAdder.prototype.startAddingItem = function(){
    if (this.getState() === 'WORKING'){
        return;
    }
    var parent_menu = this._parent_menu;
    parent_menu.freeze();
    //create the item
    var menu_item = new MenuItem(parent_menu, []);
    var content = this._content_item_creator();
    var me = this;
    content.backupStateTransitionEventHandlers();
    content.setStateTransitionEventHandlers({
        DISPLAY: function(){
            me.setState('IDLE');
            parent_menu.unfreeze();
        }
    });
    menu_item.setContent(content);

    var parent_item = menu_item.getParentMenuItem();
    if (parent_item){
        parent_item.setChildless(false);
        parent_item.setDeletable(false);
    }

    this._parent_menu.addMenuItem(menu_item);

    this.setState('WORKING');
};

/**
 * NOTE: menu should have subclassed DropDown
 * but DropDown was written after, therefore there is
 * some code duplication
 *
 * @constructor
 * a menu widget, which may be nested
 * elements of the menu are instances of
 * ``MenuItem``
 * the menu may be editable in place
 */
var Menu = function(){
    Widget.call(this);
    /**
     * @private
     * @type {?MenuItem}
     */
    this._active_item = null;
    /**
     * @private
     * @type {MenuData} menu items
     */
    this._children = [];
    /**
     * @private
     * @type {?MenuItemAdder}
     */
    this._menu_item_adder = null;
    /**
     * @private
     * @type {Function}
     */
    this._content_item_constructor = null;
    /**
     * @private
     * @type {number}
     */
    this._close_delay = 350;//ms before the menues close
    /**
     * @private
     * @type {?Menu}
     */
    this._parent_menu = null;
    /**
     * @private
     * @type {?Object}
     */
    this._parent_content_item = null;
    /**
     * @private
     * @type {?MenuItem}
     */
    this._parent_menu_item = null;
    /** 
     * @private
     * @type {Array.<Menu>}
     * stack of open menues, with leaf being the last item
     * and root - the first item
     */
    this._menu_stack = [];

    /**
     * @private
     * @type {boolean}
     */
    this._is_editable = true;

    /**
     * @private
     * @type {boolean}
     */
    this._is_frozen = false;

    /**
     * @private
     * @type {number}
     */
    this._z_index = 999999;
};
inherits(Menu, Widget);

/**
 * @private
 * @return {boolean}
 */
Menu.prototype.isRoot = function(){
    return (this._parent_menu === null);
};

/**
 * @param {boolean} is_editable
 */
Menu.prototype.setEditable = function(is_editable){
    this._is_editable = is_editable;
};
/**
 * @return {boolean}
 */
Menu.prototype.isEditable = function(){
    return this._is_editable;
};

/**
 * @return {boolean}
 */
Menu.prototype.isEmpty = function(){
    return (this._children.length === 0);
};

/**
 * @param {Object} parent_content
 */
Menu.prototype.setParentContentItem = function(parent_content){
    this._parent_content_item = parent_content;
    $.each(this._children, function(idx, menu_item){
        menu_item.getContent().setParent(parent_content);
    });
};
/**
 * @return {Object}
 */
Menu.prototype.getParentContentItem = function(){
    return this._parent_content_item;
};

/**
 * @param {MenuItem} menu_item
 */
Menu.prototype.setParentMenuItem = function(menu_item){
    this._parent_menu_item = menu_item;
};

/**
 * @return {MenuItem}
 */
Menu.prototype.getParentMenuItem = function(){
    return this._parent_menu_item;
};

/**
 * @return {number}
 */
Menu.prototype.getZIndex = function(){
    return this._z_index;
};
/**
 * @param {number} z_index
 */
Menu.prototype.setZIndex = function(z_index){
    this._z_index = z_index;
    if (this._element){
        this._element.css('z-index', z_index);
    }
};



/**
 * @param {MenuData} data the category tree data
 */
Menu.prototype.setData = function(data){
    /**
     * @private
     * @type {MenuData}
     */
    this._data = data;
};

/**
 * @param {Function} creator
 */
Menu.prototype.setContentItemCreator = function(creator){
    this._content_item_creator = creator;
};

/**
 * @param {MenuData}
 * @return {Object} menu item content object
 */
Menu.prototype.createContentItem = function(data){
    return this._content_item_creator(data);
};

/**
 * creates the menu item,
 * sets its content and builds the child_menu
 * if there any child elements 
 * in the data
 * @param {MenuItemData} data
 * @return {MenuItem}
 */
Menu.prototype.createMenuItem = function(data){
    var menu_item = new MenuItem(this, data);

    //set menu item content
    var item_content = this.createContentItem(data);
    item_content.setEditable(this.isEditable());
    item_content.copyStateTransitionEventHandlersFrom(this);

    menu_item.setContent(item_content);

    //build child menu
    if (data['children'].length > 0){
        var child_menu = menu_item.buildSubtree();
    }
    return menu_item;
};

/**
 * @return {MenuItemAdder}
 */
Menu.prototype.getMenuItemAdder = function(){
    return this._menu_item_adder;
};

/**
 * adds "content" item to the menu
 * @param {MenuItem} menu_item
 */
Menu.prototype.addMenuItem = function(menu_item){
    var item_element = menu_item.getElement();
    if (this._menu_item_adder){
        this._menu_item_adder.getElement().before(item_element);
    } else {
        this._element.append(item_element);
    }
    this._children.push(menu_item);
};

/**
 * @param {MenuItem} menu_item
 * removes menu item from the menu
 */
Menu.prototype.removeMenuItem = function(menu_item){
    //a problem - we have references to children in Menu and MenuItem
    var parent_item = menu_item.getParentMenuItem();
    if (parent_item){
        parent_item.removeChildMenuItem(menu_item);
    }
    //now clean refs from the menu:
    for (var i = 0; i<this._children.length; i++){
        if (menu_item === this._children[i]){
            this._children.splice(i, 1);
            return;
        }
    }
};

Menu.prototype.createMenuItemAdder = function(){
    var item_adder = new MenuItemAdder(this);
    var me = this;
    item_adder.setContentItemCreator(function(){
        var item = me.createContentItem();
        item.setEditable(true);//we do not call this otherwise
        item.setState('EDIT')
        item.setParent(me.getParentContentItem());
        return item;
    });
    return item_adder;
};

/**
 * decorates any element by replacing its content
 * with the nested <ul> HTML code representing the 
 * category tree
 * @param {Object} element - parent jQuery object
 * @param {boolean?} is_root - true if it must be root menu
 * root menu opens right below the element, others - to the right
 */
Menu.prototype.decorate = function(element, is_root){
    if (this._data === null){
        return;
    }
    this._is_root = is_root;
    this._root_element = element;//the button which opens the menu
    this._root_element.after(this.getElement());//calls this.createDom()
    var me = this;
    this._root_element.mouseover(function(){
        me.open()
    });
    this._root_element.mouseout(function(){
        me.startClosing();
    });
};

/**
 * @private
 * called before an item starts to become edited
 */
Menu.prototype.stopEditingAllItems = function(){
    var menu_stack = this.getMenuStack();
    $.each(menu_stack, function(idx, open_menu){
        $.each(open_menu._children, function(idx, menu_item){
            menu_item.setState('DISPLAY');
        });
    });
};

/**
 * @private
 * sets transition event handlers to the menu
 * supported states are EDIT, DISPLAY and ADD
 */
Menu.prototype.initStateTransitionEventHandlers = function(){
    var me = this;
    //need to prevent editing more than one entry at a time
    this.setStateTransitionEventHandlers({
        EDIT: function(){
            me.stopEditingAllItems();
            me.freeze();
        },
        DISPLAY: function(){
            me.unfreeze();
        }
    });
};

/**
 * freezes the menu - so it does not collapse
 * until "unfrozen"
 */
Menu.prototype.freeze = function(){
    //use a private attribute...
    this.getRootMenu()._is_frozen = true;
};
Menu.prototype.unfreeze = function(){
    this.getRootMenu()._is_frozen = false;
};

/**
 * @private
 * a hack allowing top level content elements
 * have parent
 */
Menu.prototype.createRootContentElement = function(){
}

/**
 * @return {boolean}
 */
Menu.prototype.isFrozen = function(){
    return this.getRootMenu()._is_frozen;
};

/**
 * creates the nested HTML <ul> which represents
 * the category tree. 
 */
Menu.prototype.createDom = function(){
    this._element = this.makeElement('ul');
    this._element.addClass('ab-menu');
    this._element.css('position', 'absolute').hide();
    
    if (this.isRoot()){
        this._element.css('z-index', this._z_index);
    } else {
        var z_index = this.getParentMenu().getZIndex() - 1;
        this.setZIndex(z_index);
    }

    this.initStateTransitionEventHandlers();

    var me = this;
    $.each(this._data, function(idx, child_node){
        //create the category (and any children within) and add it to the tree
        var menu_item = me.createMenuItem(child_node);
        me.addMenuItem(menu_item);
    });
    if (this.isEditable()){
        var item_adder = this.createMenuItemAdder();
        this._element.append(item_adder.getElement());
        this._menu_item_adder = item_adder;
    }
    this.createRootContentElement();
};

/**
 * Opens the menu
 */
Menu.prototype.open = function(){
    if (this.isFrozen()){
        return;
    }
    var position = {my: 'left top'};
    if (this.isRoot()){
        position['at'] = 'left bottom';
        position['of'] = this._root_element;
    } else {
        position['at'] = 'right top';
        position['of'] = this._parent_menu.getActiveItem().getElement();
    }
    this._element.show();
    this._element.position(position);
    var menu_stack = this.getMenuStack();
    menu_stack.push(this);

};

/**
 * @return {MenuItem} 
 * currently active menu item
 */
Menu.prototype.getActiveItem = function(){
    return this._active_item;
};

/**
 * @param {MenuItem} menu_item
 */
Menu.prototype.setActiveItem = function(menu_item){
    if (this.isFrozen()){
        return;
    }
    this._active_item = menu_item;
    menu_item.activate();
};

/**
 * starts a timer to close all the menues
 * in the tree
 */
Menu.prototype.startClosing = function(){
    if (this.isFrozen()){
        return;
    }
    var me = this;
    var timer = setTimeout(
                    function(){me.closeAll()},
                    me._close_delay
                );
    this.setGlobalCloseTimer(timer);
};

/**
 * @return {Array.<Menu>}
 * returns the stack of open menues
 */
Menu.prototype.getMenuStack = function(){
    var root = this.getRootMenu();
    return root._menu_stack;
};

/**
 * @private
 * @param {number} timer
 * sets the global menu close timer
 */
Menu.prototype.setGlobalCloseTimer = function(timer){
    var root = this.getRootMenu();
    root.setCloseTimer(timer);
};

/**
 * @private
 * @return {number} the timer
 */
Menu.prototype.getGlobalCloseTimer = function(){
    return this.getRootMenu().getCloseTimer();
};

/**
 * @private
 * @return {Menu}
 * returns the top level menu
 */
Menu.prototype.getRootMenu = function(){
    if (this.isRoot()){
        return this;
    } else {
        return this.getParentMenu().getRootMenu();
    }
};

/**
 * @private
 * @return {Menu}
 */
Menu.prototype.getParentMenu = function(){
    return this._parent_menu;
};

/**
 * @private
 * @param {number} timer
 */
Menu.prototype.setCloseTimer = function(timer){
    this._close_timer = timer;
};

/**
 * @private
 * @return {number} timer
 */
Menu.prototype.getCloseTimer = function(){
    return this._close_timer;
};

/**
 * closes all menues immediately
 */
Menu.prototype.closeAll = function(){
    if (this.isFrozen()){
        return;
    }
    var menu_stack = this.getMenuStack();
    for (var i = menu_stack.length - 1; i >= 0; i--){
        menu_stack[i].close();
        menu_stack.pop();
    }
};

/**
 * cancels closure of all menues
 */
Menu.prototype.stopClosingAll = function(){
    var timer = this.getGlobalCloseTimer();
    clearTimeout(timer);
};

/**
 * closes any open child menues
 */
Menu.prototype.closeChildren = function(){
    if (this.isFrozen()){
        return;
    }
    var menu_stack = this.getMenuStack();
    for (var i = menu_stack.length - 1; i >= 0; i--){
        if (menu_stack[i] === this){
            break;
        }
        menu_stack[i].close();
        menu_stack.pop();
    }
};

/**
 * @param {Menu} parent_menu
 */
Menu.prototype.setParent = function(parent_menu){
    this._parent_menu = parent_menu;
};

/**
 * @return {Menu}
 * "bear a child to its own likeness"
 */
Menu.prototype.createChild = function(){
    var child = new Menu();
    child.setContentItemCreator(this._content_item_creator);
    child.setParent(this);
    child.setEditable(this.isEditable());
    return child;
};

/**
 * closes current menu
 * and if menu is editable, sets the state to DISPLAY
 * on all child items
 */
Menu.prototype.close = function(){
    if (this.isFrozen()){
        return;
    }
    this.getElement().hide();
    $.each(this._children, function(idx, menu_item){
        menu_item.setState('DISPLAY');
    });
};

/**
 * @constructor
 * @extends {WrappedElement}
 * @param {string} tag_name
 * @param {CategoryData} cat_data
 */
var TagCategory = function(tag_name, cat_data){
    WrappedElement.call(this);
    /**
     * @private
     * @type {string}
     */
    this._tag_name = tag_name;
    /**
     * @private
     * @type {CategoryData}
     */
    this._category_data = cat_data;
};
inherits(TagCategory, WrappedElement);

/**
 * @return {string}
 */
TagCategory.prototype.getTagName = function(){
    return this._tag_name;
};
/**
 * @return {number}
 */
TagCategory.prototype.getCategoryId = function(){
    return this._category_data['id'];
};
/**
 * @return {string}
 */
TagCategory.prototype.getCategoryName = function(){
    return this._category_data['name'];
};

TagCategory.prototype.getDeleteHandler = function(){
    var me = this;
    return function(){ 
        var on_delete = function(){ me.dispose() };
        me.startDeleting(on_delete);
    }
};

TagCategory.prototype.createDom = function(){
    this._element = this.makeElement('div');
    this._element.addClass('tag-category');
    this._cat_span = this.makeElement('span');
    var cat_name = this._category_data['name'];
    this._cat_span.html(cat_name);

    var tag_name = this._tag_name;
    var fmts = gettext('remove category %(cat_name)s from tag %(tag_name)s');
    msg = interpolate(fmts, {cat_name: cat_name, tag_name: tag_name}, true);

    var deleter = new DeleteIcon(msg);
    deleter.setHandler(this.getDeleteHandler());
    this._deleter = deleter;

    this._element.append(this._cat_span);
    this._element.append(deleter.getElement());
};

/**
 * @param {Function} on_complete
 */
TagCategory.prototype.startAddingToDatabase = function(on_complete){
    var data = {
        tag_name: this.getTagName(),
        cat_id: this.getCategoryId()
    };
    $.ajax({
        type: 'POST',
        cache: false,
        dataType: 'json',
        url: askbot['urls']['add_tag_to_category'],
        data: data,
        success: on_complete
    });
};

/**
 * @private
 * @param {Function} on_delete - what to do when done
 */
TagCategory.prototype.startDeleting = function(on_delete){
    var cat_id = this._category_data['id'];
    var tag_name = this._tag_name;
    $.ajax({
        type: 'POST',
        cache: false,
        dataType: 'json',
        data: {cat_id: cat_id, tag_name: tag_name},
        url: askbot['urls']['remove_tag_from_category'],
        success: on_delete
    });
};

TagCategory.prototype.dispose = function(){
    this._cat_span.remove();
    this._deleter.dispose();
};

/**
 * @constructor
 * @extends {Widget}
 * @param {TagCategorizer} categorizer - owner of the adder
 */
var TagCategoryAdder = function(categorizer){
    Widget.call(this);
    /**
     * @private
     * @type {TagCategorizer}
     */
    this._categorizer = categorizer;
    /**
     * @private
     * @type {?Function}
     */
    this._onblur = null;
    /**
     * @private
     * @type {?Function}
     */
    this._onfocus = null;
};
inherits(TagCategoryAdder, Widget);
/**
 * @param {Function} onblur
 */
TagCategoryAdder.prototype.setOnBlurHandler = function(onblur){
    this._onblur = onblur;
};
/**
 * @param {Function} onfocus
 */
TagCategoryAdder.prototype.setOnFocusHandler = function(onfocus){
    this._onfocus = onfocus;
};

TagCategoryAdder.prototype.createDom = function(){
    this._element = this.makeElement('div');

    this._prompt_element = this.makeElement('p');
    this._prompt_element.html(gettext('Categorize this tag:'));
    this._element.append(this._prompt_element);

    this._input_element = $('<input type="text" />');
    this._element.append(this._input_element);

    var me = this;
    this._input_element.focus(function(){
        if (me._onfocus){
            me._onfocus();
        }
    });

    this._ac = $.extend(false, {}, askbot['var']['category_ac']);
    this._ac.decorate(this._input_element);

    var categorizer = this._categorizer;
    var tag_name = categorizer.getTagName();
    var input_element = this._input_element;
    var on_item_select = function(ac_data){//ac_data - from autocompleter
        var cat_data = {name: ac_data['value'], id: ac_data['data'][0]};
        var tag_cat = new TagCategory(tag_name, cat_data);

        var on_complete = function(){
            categorizer.addTagCategory(tag_cat)
            input_element.val('');
        };
        tag_cat.startAddingToDatabase(on_complete);
    };

    this._ac.setOption('onItemSelect', on_item_select);
};

TagCategoryAdder.prototype.blur = function(){
    this._input_element.blur();
    this._input_element.val('');
    if (this._onblur){
        this._onblur();
    }
};

/**
 * @constructor
 * @extends {Widget}
 * @param {string} tag_name
 */
var TagCategorizer = function(tag_name){
    Widget.call(this);
    /**
     * @private
     * @type {?CategoryData}
     */
    this._category_data = null;
    /**
     * @private
     * @type {string}
     */
    this._tag_name = tag_name;
    /**
     * @private
     * @type {?Function}
     */
    this._onblur = null;
    /**
     * @private
     * @type {?Function}
     */
    this._onfocus = null;
};
inherits(TagCategorizer, Widget);

/**
 * @return {string}
 */
TagCategorizer.prototype.getTagName = function(){
    return this._tag_name;
};

/**
 * @param {TagCategory}
 */
TagCategorizer.prototype.addTagCategory = function(tag_category){
    this._cats.addContent(tag_category);
    this._cats.getElement().show();
};
/**
 * @param {TagCategory}
 */
TagCategorizer.prototype.removeTagCategory = function(tag_category){
    this._cats.removeContent(tag_category);
    if (this._cats.isEmpty()){
        this._cats.getElement().hide();
    }
};

TagCategorizer.prototype.createDom = function(){
    this._element = this.makeElement('div');
    this._element.addClass('tag-categorizer');

    var cats = new Container();
    this._cats = cats;

    var cats_element = cats.getElement().hide();
    this._cats_element = cats_element;
    this._element.append(cats_element);

    this._loader = new Loader();
    this._element.append(this._loader.getElement());
};

/**
 * @param {Function} on_finish
 */
TagCategorizer.prototype.startLoading = function(){
    if (this._category_data){
        return;
    }
    var me = this;
    var loader = this._loader;
    loader.run();

    var on_load = function(){ 
        loader.dispose();
        me.renderData();
    };

    this.fetchData(on_load);
};
/**
 * @param {Function} onblur
 */
TagCategorizer.prototype.setOnBlurHandler = function(onblur){
    this._onblur = onblur;
};
/**
 * @param {Function} onfocus
 */
TagCategorizer.prototype.setOnFocusHandler = function(onfocus){
    this._onfocus = onfocus;
};

TagCategorizer.prototype.blur = function(){
    this._loader.stop();
    if (this._category_adder){
        this._category_adder.blur();
    }
};

/**
 * @private
 * @param {Function} on_load - what do once data is loaded
 */
TagCategorizer.prototype.fetchData = function(on_load){
    var me = this;
    var tag_name = this._tag_name;
    $.ajax({
        type: 'POST',
        cache: true,
        dataType: 'json',
        data: {tag_name: tag_name},
        url: askbot['urls']['get_tag_categories'],
        success: function(data, text_status, xhr){
            if (data['status'] === 'success'){
                me._category_data = data['cats']
                on_load();
            }
        }
    });
};

/**
 * removes the loader
 * and draws the data
 */
TagCategorizer.prototype.renderData = function(){
    var me = this;
    var tag_name = this._tag_name;
    if (this._category_data.length > 0){
        $.each(this._category_data, function(idx, cat_data){
            var cat = new TagCategory(tag_name, cat_data);
            me.addTagCategory(cat);
        });
    }
    var adder = new TagCategoryAdder(this);
    adder.setOnBlurHandler(this._onblur);
    adder.setOnFocusHandler(this._onfocus);

    this._element.append(adder.getElement());
    this._category_adder = adder;
};

/**
 * @constructor
 * @extends {DropDown}
 */
var TagDropDown = function(){
    DropDown.call(this);
    /**
     * @private
     * @type {?string}
     */
    this._tag_name = null;
    /**
     * @private
     * @type {?TagData}
     */
    this._tag_data;
};
inherits(TagDropDown, DropDown);
/**
 * @param {Object}
 */
TagDropDown.prototype.decorate = function(element){
    this._tag_name = element.html();
    TagDropDown.superClass_.decorate.call(this, element);
};

/**
 * over riding the parents getContent
 * kind of a hack
 */
TagDropDown.prototype.getContent = function(){
    if (!this._content){
        var content = new Container();
        content.addClass('tag-menu');

        var categorizer = new TagCategorizer(this._tag_name);
        var me = this;
        categorizer.setOnBlurHandler(function(){ me.unfreeze() });
        categorizer.setOnFocusHandler(function(){ me.freeze() });
        this.getElement().append(categorizer.getElement());
        categorizer.startLoading();

        content.addContent(categorizer);

        this._content = content;
    }
    return this._content;
};

var init_tag_menu = function(){
    $.each($('[rel="tag"]'), function(idx, item){
        if (! item.has_tag_menu ){
            var dd = new TagDropDown();
            dd.decorate($(item));
            item.has_tag_menu = true;
        }
    });
};

var init_category_menu = function(is_editable){
    //set up category menu
    var cats = new Menu();
    //do not show the topmost level
    cats.setData(askbot['data']['categories'][0]['children']);
    cats.setEditable(is_editable);
    cats.setContentItemCreator(function(item_data){
        var category = new Category();
        if (item_data && 'name' in item_data && 'id' in item_data){
            category.setName(item_data['name']);
            category.setId(item_data['id']);
        }
        return category;
    });
    cats.decorate($('#ab-cats'), true);

    /* set the off-limits root category as parent to the first level categories */
    var root_cat = new Category();
    root_cat.setName(askbot['data']['categories'][0]['name']);
    root_cat.setId(askbot['data']['categories'][0]['id']);
    cats.setParentContentItem(root_cat);

    //save category autocompleter for the future reuse
    askbot['var'] = askbot['var'] || {};
    askbot['var']['category_ac'] = new AutoCompleter({
        data: flattenCategoryData(askbot['data']['categories'][0]['children']),
        minChars: 1,
        useCache: true,
        matchInside: true,
        maxCacheLength: 100,
        delay: 10,
    });
};
/**
 * AutoCompleter Object, refactored closure style from
 * jQuery autocomplete plugin
 * @param {Object=} options Settings
 * @constructor
 */
var AutoCompleter = function(options) {

    /**
     * Default options for autocomplete plugin
     */
    var defaults = {
        autocompleteMultiple: true,
        multipleSeparator: ' ',//a single character
        inputClass: 'acInput',
        loadingClass: 'acLoading',
        resultsClass: 'acResults',
        selectClass: 'acSelect',
        queryParamName: 'q',
        limitParamName: 'limit',
        extraParams: {},
        lineSeparator: '\n',
        cellSeparator: '|',
        minChars: 2,
        maxItemsToShow: 10,
        delay: 400,
        useCache: true,
        maxCacheLength: 10,
        matchSubset: true,
        matchCase: false,
        matchInside: true,
        mustMatch: false,
        preloadData: false,
        selectFirst: false,
        stopCharRegex: /\s+/,
        selectOnly: false,
        formatItem: null,           // TBD
        onItemSelect: false,
        autoFill: false,
        filterResults: true,
        sortResults: true,
        sortFunction: false,
        onNoMatch: false
    };

    /**
     * Options dictionary
     * @type Object
     * @private
     */
    this.options = $.extend({}, defaults, options);

    /**
     * Cached data
     * @type Object
     * @private
     */
    this.cacheData_ = {};

    /**
     * Number of cached data items
     * @type number
     * @private
     */
    this.cacheLength_ = 0;

    /**
     * Class name to mark selected item
     * @type string
     * @private
     */
    this.selectClass_ = 'jquery-autocomplete-selected-item';

    /**
     * Handler to activation timeout
     * @type ?number
     * @private
     */
    this.keyTimeout_ = null;

    /**
     * Last key pressed in the input field (store for behavior)
     * @type ?number
     * @private
     */
    this.lastKeyPressed_ = null;

    /**
     * Last value processed by the autocompleter
     * @type ?string
     * @private
     */
    this.lastProcessedValue_ = null;

    /**
     * Last value selected by the user
     * @type ?string
     * @private
     */
    this.lastSelectedValue_ = null;

    /**
     * Is this autocompleter active?
     * @type boolean
     * @private
     */
    this.active_ = false;

    /**
     * Is it OK to finish on blur?
     * @type boolean
     * @private
     */
    this.finishOnBlur_ = true;

    this.options.minChars = parseInt(this.options.minChars, 10);
    if (isNaN(this.options.minChars) || this.options.minChars < 1) {
        this.options.minChars = 2;
    }

    this.options.maxItemsToShow = parseInt(this.options.maxItemsToShow, 10);
    if (isNaN(this.options.maxItemsToShow) || this.options.maxItemsToShow < 1) {
        this.options.maxItemsToShow = 10;
    }

    this.options.maxCacheLength = parseInt(this.options.maxCacheLength, 10);
    if (isNaN(this.options.maxCacheLength) || this.options.maxCacheLength < 1) {
        this.options.maxCacheLength = 10;
    }

    if (this.options['preloadData'] === true){
        this.fetchRemoteData('', function(){});
    }
};
inherits(AutoCompleter, WrappedElement);

AutoCompleter.prototype.decorate = function(element){

    /**
     * Init DOM elements repository
     */
    this._element = element;

    /**
     * Switch off the native autocomplete
     */
    this._element.attr('autocomplete', 'off');

    /**
     * Create DOM element to hold results
     */
    this._results = $('<div></div>').hide();
    if (this.options.resultsClass) {
        this._results.addClass(this.options.resultsClass);
    }
    this._results.css({
        position: 'absolute'
    });
    $('body').append(this._results);

    this.setEventHandlers();
};

AutoCompleter.prototype.setEventHandlers = function(){
    /**
     * Shortcut to self
     */
    var self = this;

    /**
     * Attach keyboard monitoring to $elem
     */
    self._element.keydown(function(e) {
        self.lastKeyPressed_ = e.keyCode;
        switch(self.lastKeyPressed_) {

            case 38: // up
                e.preventDefault();
                if (self.active_) {
                    self.focusPrev();
                } else {
                    self.activate();
                }
                return false;
            break;

            case 40: // down
                e.preventDefault();
                if (self.active_) {
                    self.focusNext();
                } else {
                    self.activate();
                }
                return false;
            break;

            case 9: // tab
            case 13: // return
                if (self.active_) {
                    e.preventDefault();
                    self.selectCurrent();
                    return false;
                }
            break;

            case 27: // escape
                if (self.active_) {
                    e.preventDefault();
                    self.finish();
                    return false;
                }
            break;

            default:
                self.activate();

        }
    });
    self._element.blur(function() {
        if (self.finishOnBlur_) {
            setTimeout(function() { self.finish(); }, 200);
        }
    });
};

AutoCompleter.prototype.position = function() {
    var offset = this._element.offset();
    this._results.css({
        top: offset.top + this._element.outerHeight(),
        left: offset.left
    });
};

AutoCompleter.prototype.cacheRead = function(filter) {
    var filterLength, searchLength, search, maxPos, pos;
    if (this.options.useCache) {
        filter = String(filter);
        filterLength = filter.length;
        if (this.options.matchSubset) {
            searchLength = 1;
        } else {
            searchLength = filterLength;
        }
        while (searchLength <= filterLength) {
            if (this.options.matchInside) {
                maxPos = filterLength - searchLength;
            } else {
                maxPos = 0;
            }
            pos = 0;
            while (pos <= maxPos) {
                search = filter.substr(0, searchLength);
                if (this.cacheData_[search] !== undefined) {
                    return this.cacheData_[search];
                }
                pos++;
            }
            searchLength++;
        }
    }
    return false;
};

AutoCompleter.prototype.cacheWrite = function(filter, data) {
    if (this.options.useCache) {
        if (this.cacheLength_ >= this.options.maxCacheLength) {
            this.cacheFlush();
        }
        filter = String(filter);
        if (this.cacheData_[filter] !== undefined) {
            this.cacheLength_++;
        }
        return this.cacheData_[filter] = data;
    }
    return false;
};

AutoCompleter.prototype.cacheFlush = function() {
    this.cacheData_ = {};
    this.cacheLength_ = 0;
};

AutoCompleter.prototype.callHook = function(hook, data) {
    var f = this.options[hook];
    if (f && $.isFunction(f)) {
        return f(data, this);
    }
    return false;
};

AutoCompleter.prototype.activate = function() {
    var self = this;
    var activateNow = function() {
        self.activateNow();
    };
    var delay = parseInt(this.options.delay, 10);
    if (isNaN(delay) || delay <= 0) {
        delay = 250;
    }
    if (this.keyTimeout_) {
        clearTimeout(this.keyTimeout_);
    }
    this.keyTimeout_ = setTimeout(activateNow, delay);
};

AutoCompleter.prototype.activateNow = function() {
    var value = this.getValue();
    if (value !== this.lastProcessedValue_ && value !== this.lastSelectedValue_) {
        if (value.length >= this.options.minChars) {
            this.active_ = true;
            this.lastProcessedValue_ = value;
            this.fetchData(value);
        }
    }
};

AutoCompleter.prototype.fetchData = function(value) {
    if (this.options.data) {
        this.filterAndShowResults(this.options.data, value);
    } else {
        var self = this;
        this.fetchRemoteData(value, function(remoteData) {
            self.filterAndShowResults(remoteData, value);
        });
    }
};

AutoCompleter.prototype.fetchRemoteData = function(filter, callback) {
    var data = this.cacheRead(filter);
    if (data) {
        callback(data);
    } else {
        var self = this;
        if (this._element){
            this._element.addClass(this.options.loadingClass);
        }
        var ajaxCallback = function(data) {
            var parsed = false;
            if (data !== false) {
                parsed = self.parseRemoteData(data);
                self.options.data = parsed;//cache data forever - E.F.
                self.cacheWrite(filter, parsed);
            }
            if (self._element){
                self._element.removeClass(self.options.loadingClass);
            }
            callback(parsed);
        };
        $.ajax({
            url: this.makeUrl(filter),
            success: ajaxCallback,
            error: function() {
                ajaxCallback(false);
            }
        });
    }
};

AutoCompleter.prototype.setOption = function(name, value){
    this.options[name] = value;
};

AutoCompleter.prototype.setExtraParam = function(name, value) {
    var index = $.trim(String(name));
    if (index) {
        if (!this.options.extraParams) {
            this.options.extraParams = {};
        }
        if (this.options.extraParams[index] !== value) {
            this.options.extraParams[index] = value;
            this.cacheFlush();
        }
    }
};

AutoCompleter.prototype.makeUrl = function(param) {
    var self = this;
    var url = this.options.url;
    var params = $.extend({}, this.options.extraParams);
    // If options.queryParamName === false, append query to url
    // instead of using a GET parameter
    if (this.options.queryParamName === false) {
        url += encodeURIComponent(param);
    } else {
        params[this.options.queryParamName] = param;
    }

    if (this.options.limitParamName && this.options.maxItemsToShow) {
        params[this.options.limitParamName] = this.options.maxItemsToShow;
    }

    var urlAppend = [];
    $.each(params, function(index, value) {
        urlAppend.push(self.makeUrlParam(index, value));
    });
    if (urlAppend.length) {
        url += url.indexOf('?') == -1 ? '?' : '&';
        url += urlAppend.join('&');
    }
    return url;
};

AutoCompleter.prototype.makeUrlParam = function(name, value) {
    return String(name) + '=' + encodeURIComponent(value);
};

/**
 * Sanitize CR and LF, then split into lines
 */
AutoCompleter.prototype.splitText = function(text) {
    return String(text).replace(/(\r\n|\r|\n)/g, '\n').split(this.options.lineSeparator);
};

AutoCompleter.prototype.parseRemoteData = function(remoteData) {
    var value, lines, i, j, data;
    var results = [];
    var lines = this.splitText(remoteData);
    for (i = 0; i < lines.length; i++) {
        var line = lines[i].split(this.options.cellSeparator);
        data = [];
        for (j = 0; j < line.length; j++) {
            data.push(unescape(line[j]));
        }
        value = data.shift();
        results.push({ value: unescape(value), data: data });
    }
    return results;
};

AutoCompleter.prototype.filterAndShowResults = function(results, filter) {
    this.showResults(this.filterResults(results, filter), filter);
};

AutoCompleter.prototype.filterResults = function(results, filter) {

    var filtered = [];
    var value, data, i, result, type, include;
    var regex, pattern, testValue;

    for (i = 0; i < results.length; i++) {
        result = results[i];
        type = typeof result;
        if (type === 'string') {
            value = result;
            data = {};
        } else if ($.isArray(result)) {
            value = result[0];
            data = result.slice(1);
        } else if (type === 'object') {
            value = result.value;
            data = result.data;
        }
        value = String(value);
        if (value > '') {
            if (typeof data !== 'object') {
                data = {};
            }
            if (this.options.filterResults) {
                pattern = String(filter);
                testValue = String(value);
                if (!this.options.matchCase) {
                    pattern = pattern.toLowerCase();
                    testValue = testValue.toLowerCase();
                }
                include = testValue.indexOf(pattern);
                if (this.options.matchInside) {
                    include = include > -1;
                } else {
                    include = include === 0;
                }
            } else {
                include = true;
            }
            if (include) {
                filtered.push({ value: value, data: data });
            }
        }
    }

    if (this.options.sortResults) {
        filtered = this.sortResults(filtered, filter);
    }

    if (this.options.maxItemsToShow > 0 && this.options.maxItemsToShow < filtered.length) {
        filtered.length = this.options.maxItemsToShow;
    }

    return filtered;

};

AutoCompleter.prototype.sortResults = function(results, filter) {
    var self = this;
    var sortFunction = this.options.sortFunction;
    if (!$.isFunction(sortFunction)) {
        sortFunction = function(a, b, f) {
            return self.sortValueAlpha(a, b, f);
        };
    }
    results.sort(function(a, b) {
        return sortFunction(a, b, filter);
    });
    return results;
};

AutoCompleter.prototype.sortValueAlpha = function(a, b, filter) {
    a = String(a.value);
    b = String(b.value);
    if (!this.options.matchCase) {
        a = a.toLowerCase();
        b = b.toLowerCase();
    }
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }
    return 0;
};

AutoCompleter.prototype.showResults = function(results, filter) {
    var self = this;
    var $ul = $('<ul></ul>');
    var i, result, $li, extraWidth, first = false, $first = false;
    var numResults = results.length;
    for (i = 0; i < numResults; i++) {
        result = results[i];
        $li = $('<li>' + this.showResult(result.value, result.data) + '</li>');
        $li.data('value', result.value);
        $li.data('data', result.data);
        $li.click(function() {
            var $this = $(this);
            self.selectItem($this);
        }).mousedown(function() {
            self.finishOnBlur_ = false;
        }).mouseup(function() {
            self.finishOnBlur_ = true;
        });
        $ul.append($li);
        if (first === false) {
            first = String(result.value);
            $first = $li;
            $li.addClass(this.options.firstItemClass);
        }
        if (i == numResults - 1) {
            $li.addClass(this.options.lastItemClass);
        }
    }

    // Alway recalculate position before showing since window size or
    // input element location may have changed. This fixes #14
    this.position();

    this._results.html($ul).show();
    extraWidth = this._results.outerWidth() - this._results.width();
    this._results.width(this._element.outerWidth() - extraWidth);
    $('li', this._results).hover(
        function() { self.focusItem(this); },
        function() { /* void */ }
    );
    if (this.autoFill(first, filter)) {
        this.focusItem($first);
    }
};

AutoCompleter.prototype.showResult = function(value, data) {
    if ($.isFunction(this.options.showResult)) {
        return this.options.showResult(value, data);
    } else {
        return value;
    }
};

AutoCompleter.prototype.autoFill = function(value, filter) {
    var lcValue, lcFilter, valueLength, filterLength;
    if (this.options.autoFill && this.lastKeyPressed_ != 8) {
        lcValue = String(value).toLowerCase();
        lcFilter = String(filter).toLowerCase();
        valueLength = value.length;
        filterLength = filter.length;
        if (lcValue.substr(0, filterLength) === lcFilter) {
            this._element.val(value);
            this.selectRange(filterLength, valueLength);
            return true;
        }
    }
    return false;
};

AutoCompleter.prototype.focusNext = function() {
    this.focusMove(+1);
};

AutoCompleter.prototype.focusPrev = function() {
    this.focusMove(-1);
};

AutoCompleter.prototype.focusMove = function(modifier) {
    var i, $items = $('li', this._results);
    modifier = parseInt(modifier, 10);
    for (var i = 0; i < $items.length; i++) {
        if ($($items[i]).hasClass(this.selectClass_)) {
            this.focusItem(i + modifier);
            return;
        }
    }
    this.focusItem(0);
};

AutoCompleter.prototype.focusItem = function(item) {
    var $item, $items = $('li', this._results);
    if ($items.length) {
        $items.removeClass(this.selectClass_).removeClass(this.options.selectClass);
        if (typeof item === 'number') {
            item = parseInt(item, 10);
            if (item < 0) {
                item = 0;
            } else if (item >= $items.length) {
                item = $items.length - 1;
            }
            $item = $($items[item]);
        } else {
            $item = $(item);
        }
        if ($item) {
            $item.addClass(this.selectClass_).addClass(this.options.selectClass);
        }
    }
};

AutoCompleter.prototype.selectCurrent = function() {
    var $item = $('li.' + this.selectClass_, this._results);
    if ($item.length == 1) {
        this.selectItem($item);
    } else {
        this.finish();
    }
};

AutoCompleter.prototype.selectItem = function($li) {
    var value = $li.data('value');
    var data = $li.data('data');
    var displayValue = this.displayValue(value, data);
    this.lastProcessedValue_ = displayValue;
    this.lastSelectedValue_ = displayValue;

    this.setValue(displayValue);

    this.setCaret(displayValue.length);
    this.callHook('onItemSelect', { value: value, data: data });
    this.finish();
};

/**
 * @return {boolean} true if the symbol matches something that is
 *                   considered content and false otherwise
 * @param {string} symbol - a single char string
 */
AutoCompleter.prototype.isContentChar = function(symbol){
    if (symbol.match(this.options['stopCharRegex'])){
        return false;
    } else if (symbol === this.options['multipleSeparator']){
        return false;
    } else {
        return true;
    }
};

/**
 * takes value from the input box
 * and saves _selection_start and _selection_end coordinates
 * respects settings autocompleteMultiple and
 * multipleSeparator
 * @return {string} the current word in the 
 * autocompletable word
 */
AutoCompleter.prototype.getValue = function(){
    var sel = this._element.getSelection();
    var text = this._element.val();
    var pos = sel.start;//estimated start
    //find real start
    var start = pos;
    for (cpos = pos; cpos >= 0; cpos = cpos - 1){
        if (cpos === text.length){
            continue;
        }
        var symbol = text.charAt(cpos);
        if (!this.isContentChar(symbol)){
            break;
        }
        start = cpos;
    }
    //find real end
    var end = pos;
    for (cpos = pos; cpos < text.length; cpos = cpos + 1){
        if (cpos === 0){
            continue;
        }
        var symbol = text.charAt(cpos);
        if (!this.isContentChar(symbol)){
            break;
        }
        end = cpos;
    }
    this._selection_start = start;
    this._selection_end = end;
    return text.substring(start, end);
}

/** 
 * sets value of the input box
 * by replacing the previous selection
 * with the value from the autocompleter
 */
AutoCompleter.prototype.setValue = function(val){
    var prefix = this._element.val().substring(0, this._selection_start);
    var postfix = this._element.val().substring(this._selection_end + 1);
    this._element.val(prefix + val + postfix);
};

AutoCompleter.prototype.displayValue = function(value, data) {
    if ($.isFunction(this.options.displayValue)) {
        return this.options.displayValue(value, data);
    } else {
        return value;
    }
};

AutoCompleter.prototype.finish = function() {
    if (this.keyTimeout_) {
        clearTimeout(this.keyTimeout_);
    }
    if (this._element.val() !== this.lastSelectedValue_) {
        if (this.options.mustMatch) {
            this._element.val('');
        }
        this.callHook('onNoMatch');
    }
    this._results.hide();
    this.lastKeyPressed_ = null;
    this.lastProcessedValue_ = null;
    if (this.active_) {
        this.callHook('onFinish');
    }
    this.active_ = false;
};

AutoCompleter.prototype.selectRange = function(start, end) {
    var input = this._element.get(0);
    if (input.setSelectionRange) {
        input.focus();
        input.setSelectionRange(start, end);
    } else if (this.createTextRange) {
        var range = this.createTextRange();
        range.collapse(true);
        range.moveEnd('character', end);
        range.moveStart('character', start);
        range.select();
    }
};

AutoCompleter.prototype.setCaret = function(pos) {
    this.selectRange(pos, pos);
};
