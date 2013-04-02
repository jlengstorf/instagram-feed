/**
 * Recent Instagram Uploads jQuery Plugin
 *
 * A simple jQuery plugin to display recent uploads for a given user.
 *
 * Copyright (c) 2013 Jason Lengstorf
 *
 * LICENSE: Permission is hereby granted, free of charge, to any person 
 * obtaining a copy of this software and associated documentation files (the 
 * "Software"), to deal in the Software without restriction, including without 
 * limitation the rights to use, copy, modify, merge, publish, distribute, 
 * sublicense, and/or sell copies of the Software, and to permit persons to 
 * whom the Software is furnished to do so, subject to the following 
 * conditions:
 *
 * The above copyright notice and this permission notice shall be included in 
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 *
 * @author    Jason Lengstorf <jason@lengstorf.com>
 * @version   1.0.0
 * @copyright 2013 Jason Lengstorf
 * @license   MIT License (http://opensource.org/licenses/mit-license.php)
 */
;(function( $, window, document, undefined ) {

    var pluginName = 'recentInstagramUploads',
        defaults   = {
            access_token: null,
            ig_username: null,
            ig_user_id: null,
            loading_selector: '.loading',
            photo_count: 12,
            photo_class: 'photo',
            callback: function(){  }
        };

    function RecentInstagramUploads( element, options )
    {
        this.element   = element;
        this.options   = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name     = pluginName;
        this.api_url   = 'https://api.instagram.com/v1/';

        this.init();
    }

    RecentInstagramUploads.prototype.init = function() {
        var options = this.options,
            cb = 'getPhotos';

        // Fails silently if no access token or username is passed
        if (
            options.access_token===null ||
            (options.ig_username===null && options.ig_user_id===null)
        ) {
            return;
        }

        // Loads the Instagram user ID from a username
        if (options.ig_user_id===null) {
            options.ig_user_id = this.getUserId(options.ig_username, cb);
        } else {
            this.getPhotos();
        }

    };

    RecentInstagramUploads.prototype.getUserId = function( username, cb ) {
        var options = this.options,
            thisCache = this,
            ajaxurl = this.api_url + "users/search?q=" + username +
                    "&access_token=" + options.access_token;

        $.ajax({
            type: "GET",
            dataType: "jsonp",
            url: ajaxurl,
            success: function( response ) {
                if (
                    typeof response.data!=='undefined' &&
                    response.data.length>0
                ) {
                    options.ig_user_id = response.data[0].id;
                    thisCache[cb]();
                }
            }
        });
    };

    RecentInstagramUploads.prototype.getPhotos = function( ) {
        var options   = this.options,
            container = $(this.element),
            ajaxurl = this.api_url + "users/" + options.ig_user_id +
                "/media/recent?access_token=" + options.access_token;

        $.ajax({
            type: "GET",
            dataType: "jsonp",
            url: ajaxurl,
            success: function( response ) {
                var length    = typeof response.data!=='undefined' ? response.data.length : 0,
                    instagram = container;

                if (length>0) {
                    instagram.find(options.loading_selector).remove();

                    for (var i=0; i<length; i++) {
                        if (i===options.photo_count) {
                            break;
                        }

                        var photo = response.data[i];

                        $("<a>")
                            .attr({
                                href: photo.images.standard_resolution.url,
                                class: options.photo_class,
                                title: photo.caption.text +
                                    ' <a href="' + photo.link + '" ' +
                                    'target="_blank">[view on Instagram]</a>'
                            })
                            .html(
                                $("<img />")
                                    .attr({
                                        src: photo.images.thumbnail.url
                                    })
                            )
                            .appendTo(instagram)
                            .wrap("<li></li>");

                        options.callback();
                    }
                }
            }
        });
    };

    $.fn[pluginName] = function( options ) {
        return this.each(function() {
            if (!$.data(this, 'plugin_'+pluginName)) {
                $.data(
                    this,
                    'plugin_' + pluginName,
                    new RecentInstagramUploads(this, options)
                );
            }
        });
    };

})( jQuery, window, document );
