
(function ($) {
    $.fn.extend({
        accessibleMenu: function (options) {
            var id = 0;

            var defaults = {
                root_alignment: 'horizontal',
                sub_alignment: 'horizontal'
            }

            var options = $.extend(defaults, options); 

            function menuObject(rootElement) {
                //First lot of menu items
                this.Children = _populateRoot(rootElement, this);
                //root element that is parsed to the plugin
                this.Element = rootElement;
                //this was used, but removed when tracking focus brought other issues.
                this.MenuItemWithFocus;
            }

            function menuItem(rootElement, menuObject) {
                //ID for each menu object. This comes in handy when tracking objects
                this.Id = id;
                id++;
                //Children of current menu item
                this.Children = _populateChildren(rootElement, menuObject);
                //boolean if current menu item has Children. Less expensive than checking length
                this.HasChildren = (this.Children != null && this.Children.length > 0);
                //root DOM element of the current menu item
                this.Element = rootElement;
                //Append menuIndex attribute to DOM element
                $(this.Element).attr('menuIndex', this.Id);
                //Parent is assigned after all menu items are built. This is a menuItem/menuObject.
                this.Parent;
                //Next sibling (menu item)
                this.NextSibling;
                //Previous sibling (menu item)
                this.PrevSibling;
                //This is not really used but once a better way of tracking focus should be used.
                this.HasFocus = false;
                //This is populated, however is not used. Also probably not very accurate due to event cycle (bottom up) of DOM elements
                this.ChildHasFocus = false;
                //This is the DIV within the LI of the menu item that contains child UL > LI elements
                this.ChildContainer = $(this.Element).children('div');
                //This is the root menu object that all menu items have reference too.
                this.MenuObject = menuObject;
                //This is not used, but was trying to filter events that I did and didn't want to use. Probably can be removed.
                this.ChildHasProcessedEvent = false;
            }


            //This is the parent function that relates parents and siblings of items to each other.
            //This is processed after the DOM has created all the menu items.
            function _populateGraph(menuObject) {
                if (menuObject.Children != null) {
                    for (var i = 0; i < menuObject.Children.length; i++) {
                        if (i > 0 && i < menuObject.Children.length - 1) {
                            _populateGraphChildren(menuObject.Children[i], menuObject, menuObject.Children[i + 1], menuObject.Children[i - 1]);
                        }
                        else {
                            if (i > 0) {
                                _populateGraphChildren(menuObject.Children[i], menuObject, null, menuObject.Children[i - 1]);
                            }
                            else {
                                _populateGraphChildren(menuObject.Children[i], menuObject, menuObject.Children[i + 1], null);

                            }
                        }

                    }
                }
            }

            //This is the recusive function relates parents and siblings of items to each other.
            function _populateGraphChildren(menuItem, parentItem, nextSib, prevSib) {
                $(menuItem.Element).children('a').addClass('nav_child');
                menuItem.Parent = parentItem;
                menuItem.NextSibling = nextSib;
                menuItem.PrevSibling = prevSib;
                if (menuItem.Children != null) {
                    if (menuItem.HasChildren)
                        $(menuItem.Element).children('a').addClass('nav_parent_children');
                    else
                        $(menuItem.Element).children('a').addClass('nav_parent');
                    for (var i = 0; i < menuItem.Children.length; i++) {
                        if (i > 0 && i < menuItem.Children.length - 1) {
                            _populateGraphChildren(menuItem.Children[i], menuItem, menuItem.Children[i + 1], menuItem.Children[i - 1]);
                        }
                        else {
                            if (i > 0) {
                                _populateGraphChildren(menuItem.Children[i], menuItem, null, menuItem.Children[i - 1]);
                            }
                            else {
                                _populateGraphChildren(menuItem.Children[i], menuItem, menuItem.Children[i + 1], null);

                            }
                        }
                    }
                }
            }

            //Parent of recusive method to find focused menu item
            function findMenuItemFromElement(menuObject) {
                var result;
                var element = $(menuObject.Element).find("*:focus").parent();
                var menuInt = element.attr('menuIndex');
                if (menuObject.Children != null) {
                    for (var i = 0; i < menuObject.Children.length; i++) {
                        result = SearchMenuItemByElement(menuObject.Children[i], menuInt);
                        if (result != null) {
                            break;
                        }
                    }
                }
                return result;
            }

            //Recursive function to find the current selected menu item. This is a bottle neck for performance until
            //a better method of tracking the focused object is found
            function SearchMenuItemByElement(menuItem, menuIndex) {
                var result;
                var menuInt = $(menuItem.Element).attr('menuIndex');
                if (menuItem.Children != null) {
                    for (var i = 0; i < menuItem.Children.length; i++) {
                        result = SearchMenuItemByElement(menuItem.Children[i], menuIndex);
                        if (result != null) {
                            break;
                        }
                    }
                }

                if (menuInt == menuIndex) {
                    result = menuItem;
                }

                return result;
            }

            //This is processed after the all menu items have been created.
            function _initMenuObject(menuObject) {
                //Only keyup bind the menuObject, not individual menu items
                _initKeyBindings(menuObject);
                //iterate through menu items and init them
                for (var i = 0; i < menuObject.Children.length; i++) {
                    _initMenuItem(menuObject.Children[i]);
                }
            }

            //Generic take focus function taking in a menuItem and index. 
            //Index is currently not used but could be for optimisation
            function _takeFocus(menuItem, menuItemIndex) {
                if (menuItem != null) {
                    if (menuItem.Parent != null) {
                        if (menuItem.Parent.ChildContainer != null)
                            menuItem.Parent.ChildContainer.show();
                        $(menuItem.Element).children('a').focus();
                    }
                }
            }

            //This is the guts of the behaviour of the menu as it controls what keys do what.
            //This is also where the options parsed into the plugin are used
            function _initKeyBindings(menuObject) {
                $(menuObject.Element).keyup(function (event) {
                    var currentMenuItem = findMenuItemFromElement(menuObject);
                    if (event.keyCode == 37) {
                        // left key
                        if (options.root_alignment == 'vertical') {
                            if (options.sub_alignment == 'vertical')
                                _processVertVert('left', currentMenuItem);
                            else
                                _processVertHorizontal('left', currentMenuItem);
                        }
                        else {
                            if (options.sub_alignment == 'horizontal')
                                _processHorizontalHorizontal('left', currentMenuItem);
                            else
                                _processHorizontalVert('left', currentMenuItem);
                        }
                    } else if (event.keyCode == 39) {
                        // right key
                        if (options.root_alignment == 'vertical') {
                            if (options.sub_alignment == 'vertical')
                                _processVertVert('right', currentMenuItem);
                            else
                                _processVertHorizontal('right', currentMenuItem);
                        }
                        else {
                            if (options.sub_alignment == 'horizontal')
                                _processHorizontalHorizontal('right', currentMenuItem);
                            else
                                _processHorizontalVert('right', currentMenuItem);
                        }
                    } else if (event.keyCode == 40) {
                        // down key
                        if (options.root_alignment == 'vertical') {
                            if (options.sub_alignment == 'vertical')
                                _processVertVert('down', currentMenuItem);
                            else
                                _processVertHorizontal('down', currentMenuItem);
                        }
                        else {
                            if (options.sub_alignment == 'horizontal')
                                _processHorizontalHorizontal('down', currentMenuItem);
                            else
                                _processHorizontalVert('down', currentMenuItem);
                        }
                    } else if (event.keyCode == 38) {
                        // up key
                        if (options.root_alignment == 'vertical') {
                            if (options.sub_alignment == 'vertical')
                                _processVertVert('up', currentMenuItem);
                            else
                                _processVertHorizontal('up', currentMenuItem);
                        }
                        else {
                            if (options.sub_alignment == 'horizontal')
                                _processHorizontalHorizontal('up', currentMenuItem);
                            else
                                _processHorizontalVert('up', currentMenuItem);
                        }
                    }

                });

            }

            function _processVertVert(direction, currentMenuItem) {
                switch (direction) {
                    case 'up':
                        if (currentMenuItem.PrevSibling != null)
                            _takeFocus(currentMenuItem.PrevSibling);
                        //                        else if (currentMenuItem.Parent != null)
                        //                            _takeFocus(currentMenuItem.Parent);
                        break;
                    case 'down':
                        if (currentMenuItem.NextSibling != null)
                            _takeFocus(currentMenuItem.NextSibling);
                        //                        else if (currentMenuItem.Parent != null && currentMenuItem.Parent.NextSibling != null)
                        //                            _takeFocus(currentMenuItem.Parent.NextSibling);
                        break;
                    case 'left':
                        if (currentMenuItem.Parent != null)
                            _takeFocus(currentMenuItem.Parent);
                        break;
                    case 'right':
                        if (currentMenuItem.Children != null)
                            _takeFocus(currentMenuItem.Children[0]);
                        break;
                }
            }

            function _processHorizontalVert(direction, currentMenuItem) {
                switch (direction) {
                    case 'up':
                        if (currentMenuItem.PrevSibling != null)
                            _takeFocus(currentMenuItem.PrevSibling);
                        else if (currentMenuItem.Parent != null)
                            _takeFocus(currentMenuItem.Parent);
                        break;
                    case 'down':
                        if (currentMenuItem.Parent == null && currentMenuItem.Children != null)
                            _takeFocus(currentMenuItem.Children[0]);
                        else if (currentMenuItem.Parent != null && currentMenuItem.NextSibling != null)
                            _takeFocus(currentMenuItem.NextSibling);
                        break;
                    case 'left':
                        if (currentMenuItem.Parent != null && currentMenuItem.Parent.PrevSibling != null)
                            _takeFocus(currentMenuItem.Parent.PrevSibling);
                        else if (currentMenuItem.PrevSibling != null)
                            _takeFocus(currentMenuItem.PrevSibling);
                        break;
                    case 'right':
                        if (currentMenuItem.Parent != null && currentMenuItem.Parent.NextSibling != null)
                            _takeFocus(currentMenuItem.Parent.NextSibling);
                        else if (currentMenuItem.NextSibling != null)
                            _takeFocus(currentMenuItem.NextSibling);
                        break;
                }
            }

            function _processHorizontalHorizontal(direction, currentMenuItem) {
                switch (direction) {
                    case 'up':
                        break;
                    case 'down':
                        break;
                    case 'left':
                        break;
                    case 'right':
                        break;
                }
            }

            function _processVertHorizontal(direction, currentMenuItem) {
                switch (direction) {
                    case 'up':
                        break;
                    case 'down':
                        break;
                    case 'left':
                        break;
                    case 'right':
                        break;
                }
            }

            //Recursive method to init each menu item.
            function _initMenuItem(menuItem) {
                if (menuItem.Children != null) {
                    for (var i = 0; i < menuItem.Children.length; i++) {
                        if (menuItem.HasChildren) {
                            $(menuItem.Element).focusin(function () {

                                _menuItemFocusIn(menuItem);
                            });
                            $(menuItem.Element).focusout(function () {
                                _menuItemFocusOut(menuItem);
                            });

                            _initMenuItem(menuItem.Children[i])
                        }
                    }
                }
            }

            //Menu item focus in function
            function _menuItemFocusIn(menuItem) {
                menuItem.HasFocus = true;
                if (menuItem.Parent != null)
                    menuItem.Parent.ChildHasFocus = true;
                menuItem.ChildContainer.show();
            }

            //Menu item focus out function
            function _menuItemFocusOut(menuItem) {
                if (!menuHasFocus(menuItem)) {
                    menuItem.HasFocus = false;
                    menuItem.ChildContainer.hide();
                    if (menuItem.Parent != null)
                        menuItem.Parent.ChildHasFocus = false;
                }
            }

            //Returns bool that checks if a child of a parent menu item has focus or not.
            function menuHasFocus(menuItem) {
                var cFocus = $(menuItem.Element).find("*:focus");
                if (cFocus.hasClass('nav_child') && (!cFocus.hasClass('nav_parent') || !cFocus.hasClass('nav_parent_children')))
                    return true;
                else
                    return false;
            }

            //This is a legacy method
            function _populateParent(rootElement) {
                var result;
                var $parent = $(rootElement).parent().parent();
                if ($parent.length != 0 && $parent[0].nodeName == 'LI') {
                    result = $parent;
                }
                else if ($parent.length != 0 && $parent[0].nodeName == 'DIV' && $parent[0].className == 'menu') {
                    result = $parent;
                }
                return result;
            }

            //build root menu children and return result
            function _populateRoot(rootElement, menuObject) {
                var result;
                var $lis = $(rootElement).children().children();
                if ($lis.length != 0 && $lis[0].nodeName == "LI") {
                    var numberOfChildren = $lis.length;
                    var childrenArray = new Array();
                    for (var i = 0; i < numberOfChildren; i++) {
                        childrenArray.push(new menuItem($lis[i], menuObject));
                    }
                    result = childrenArray;
                }
                return result;
            }

            //build child object arrays and return result
            function _populateChildren(rootElement, menuObject) {
                var result;
                var $lis = $(rootElement).children().children();
                if ($lis.length != 0 && $lis[0].nodeName == "UL") {
                    var numberOfChildren = $lis.children().length;
                    var childrenArray = new Array();
                    for (var i = 0; i < numberOfChildren; i++) {
                        childrenArray.push(new menuItem($lis.children()[i], menuObject));
                    }
                    result = childrenArray;
                }
                else {
                    result = null;
                }
                return result;
            }


            //This should be cleaned up at some point.
            var m = new menuObject(this);
            _initMenuObject(m);
            _populateGraph(m);
            //debugger;
        }
    });
})(jQuery);