//jquery utils

String.prototype.ssplit = function (char, amount) {
    if (amount === 0) return [];
    var parts = this.split(char);
    var len = parts.length - 1;
    if (amount && Math.abs(amount) < len) {
        if (amount > 0) {
            var splited = parts.splice(0, amount);
            var toJoin = parts.splice(0,len).join(char);
            parts = splited.concat(toJoin);
        }else{
            var splited = parts.splice(amount, len);
            var toJoin = parts.splice(0,len).join(char);
            parts = [].concat(toJoin, splited);
        }
    }
    return parts;
};

$.extend({ 
    textToHtml: function(text){
        /*
        This function will transform the given text into HTML text.
        For example:
            "this is a\nmultiline\nString" -> "this is a<br>multiline<br>String"

        More to come.
        */

        if (text !== undefined) {
            var htmlText = $('<div></div>').text(text).html();
            return htmlText.replace(/\n/g, '<br>');
        }

        return "";
    },
    htmlToText: function(htmlText){
        /*
        This function does the oposite of textToHtml
        */

        if (htmlText !== undefined) {

            var text = htmlText.replace(/<br>|<\/br>/g, '\n');
            return $('<div></div>').html(text).text();
            // return text;
        }

        return "";

    },
    sorted : function(obj, sortFunction){
        var type = $.type(obj);
        if(type === "object"){
            var keys = Object.keys(obj).sort(sortFunction);
            var sortedObj = {};
            for (var i = 0; i < keys.length; i++) {
                sortedObj[keys[i]] = obj[keys[i]];
            }
            return sortedObj;
        } 

        return obj;
    },
    toLinearArray : function(){
        /*
        Merge and converts a multi dimentional array into a single dimentional array
        For instance:
            $.toLinearArray(0,1,[[[4, 5],2],3], [8], 3, null, [0]) -> [0, 1, 4, 5, 2, 3, 8, 3, null, 0]
        */

        var dest = [];
        var objToMerge = Array.prototype.slice.call(arguments, 0);
        
        function append(d, o){
            var len = o.length;
            for (var i = 0; i < len; i++) {
                var obj = o[i];
                if (!$.isArray(obj)){
                    d.push(obj);
                }else{
                    append(d, obj);
                }
            }
        }

        append(dest, objToMerge);

        return dest;
    },
    attribute : function(){
        function getAttrFromPath(o, p){
            var pp = p.split('.');
            var i = 0;
            while(i < pp.length && o !== undefined){
                o = o[pp[i]];
                i = i + 1;
            }
            return o;
        };
        switch(arguments.length){
            case 2:
                // console.log('path' + arguments[1]);
                return getAttrFromPath(arguments[0], arguments[1]);
            case 3:
                var res = arguments[1].split('.');
                var obj = arguments[0];
                for(var i = 0; i < res.length - 1; i++) {
                    var a = res.shift();
                    if (obj[a] === undefined) {
                        obj[a] = {};
                    }
                    obj = obj[a];
                }
                obj[res[0]] = arguments[2];
                return 
            default:
                throw "$.attribute must receive 2 or 3 arguments";
        }
    },
    changeLocation : function(href, data){
        /*
        This method navigates to the href address sending data in post method
        */
        var div = $('<div class="hidden"></div>');
        $('body').append(div);
        var html = '<form action="'+href+'" method="post">';
        for (var k in data){
            html += '<input name="' + k + '" value="' + data[k] + '"/>';
        }
        html += '</form>';

        div.html(html);

        div.children('form').submit();

    }
});

$.fn.extend({
    relative : function(rel){
        /*
        This function returns the position of an object relative to the argument rel.
        If rel is not defined, the position is relative to the page.
        */

        var $rel = $(rel);
        var res = this.offset();

        if ($rel.size() > 0) {
            var relOffset = $rel.offset();
            return {'top': (res.top - relOffset.top), 'left':(res.left - relOffset.left)};
        }else{
            return res;
        }
    },
    humanize : function(text){
        /*
        This function sets or gets a human version of the text inside an html object
        */
        if (arguments.length === 0){
            //Get the inner html as a string
            return $.htmlToText(this.html());
        }else{
            //Set inner html to this
            this.html($.textToHtml(text));
        }
    },
    dimensions : function(rel){
        if (arguments.length === 0){
            var res = {
                'top': this[0].offsetTop,
                'left': this[0].offsetLeft,
                'width': this[0].scrollWidth,
                'height': this[0].scrollHeight
            };
            return res;
        }

        var res = this.relative(rel);
        res['width'] = this[0].scrollWidth;
        res['height'] = this[0].scrollHeight;

        return res;
    },
    containsInside : function(rel){
        //This function returns if a jQuery object contains graphicaly another object
        var myDim = this.dimensions();
        var relDim = $(rel).dimensions();

        if (relDim.top < myDim.top ||
            relDim.left < myDim.left ||
            relDim.top + relDim.height > myDim.top + myDim.height ||
            relDim.left + relDim.width > myDim.left + myDim.width
            ){
            return false;
        }

        return true;
    },
    formAttributes : function(){
        //This functions transforms the serializeArray's array of object result into a single object 
        //  with one unique key for each element name

        var result = {};
        var fields = this.serializeArray();

        for (var i = fields.length - 1; i >= 0; i--) {
            var value = fields[i].value !== ""?fields[i].value:null;
            var attr = $.attribute(result, fields[i].name);
            if(attr === undefined){
                $.attribute(result, fields[i].name, value);
            }else{
                if (attr && attr.push){
                    attr.push(value);
                }else{
                    $.attribute(result, fields[i].name, [attr, value]);
                }
            }
        }
        return result;
    },
    fillFromObject : function(obj){
        if (this[0].tagName.toUpperCase() !== 'TABLE') {
            //By the moment, no other element than TABLE will be filled with this function
            throw this.toString() + ' is not a TABLE element';
        }

        var html = '';
        var body = '';
        var bodyObj = !$.isArray(obj.body);
        if(bodyObj){
            //Is an Object
            for(var k in obj.body){
                body += '<tr>';
                body += '<th>' + k + '</th>';
                for (var i = 0; i < obj.body[k].length; i++) {
                    body += '<td class="col'+i+'">' + obj.body[k][i] + '</td>';
                }
                body += '</tr>';
            }
        }else{
            //Is an Array
            for(var r = 0; obj.body.length; r++){
                body += '<tr>';
                for (var i = 0; i < obj.body[r].length; i++) {
                    body += '<td class="col'+i+'">' + obj.body[r][i] + '</td>';
                }
                body += '</tr>';
            }
        }

        if (obj.head) {
            html += '<tr>';
            if (bodyObj) {
                html += '<th></th>';
            }
            for (var i = 0; i < obj.head.length; i++) {
                html += '<th class="col'+i+'">' + obj.head[i] + '</th>';
            }
            html += '</tr>';
        }

        this.html(html + body);
    },
    fillFromJson : function(json){

    }
});

$(function(){
    //Some functions to modify html default behavior
    $(document).on('group-change', '.toggle:radio', function(e, originalTarget){
        var that = e.target;
        that.dataset['checked'] = that == originalTarget && that.dataset['checked'] !== "true";
        that.checked = that.dataset['checked'] === "true";

        //Triggering change event on each associate label
        for (var i = that.labels.length - 1; i >= 0; i--) {
            $(that.labels[i]).trigger('change', {checked:that.checked});
        };
    });

    $(document).on('click', '.toggle:radio', function(e){
        $('.toggle:radio[name="'+ e.target.name +'"]').trigger('group-change', [e.target]);
    });
});

