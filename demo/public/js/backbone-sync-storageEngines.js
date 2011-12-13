/**
 * User: k33g (Original Author)
 * Date: 26/08/11
 * User: mbrio (Added ability to create and specify multiple storage engines)
 * Date: 12/12/11
 */
 
(function(Backbone) {
    Backbone.storageEngines = {
        default: Backbone.sync,
        localStorage: function(method, model, options) {
            var resp;
            var store = window.localStorage;

            function GUID() {
                var S4 = function () {
                    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
                };
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            };

            function save (obj) {
                var id = obj.storeName + '|' + (obj.id || GUID());
                store.setItem(id, JSON.stringify(obj));
                obj.id = id.split('|')[1];
                return obj;
            };

            function get (obj) {
                return JSON.parse(store.getItem(obj.storeName + '|' + obj.id));
            };

            function remove (obj) {
                var key = obj.storeName + '|' + obj.id;
                store.removeItem(key);
                return obj;
            };

            function all (collection) {
                var i, l = store.length, id, key, baseName, obj;
                for (i = 0; i < l; i += 1) {
                    id = store.key(i);
                    baseName = id.split('|')[0];
                    key = id.split('|').slice(1).join("|");
                    if (baseName === collection.storeName) {
                        obj = JSON.parse(store.getItem(id));
                        collection.add(obj);
                    }
                }
            };

            switch (method) {
                case "read":    resp = model.id ? get(model) : all(model); break;
                case "create":  resp = save(model);                        break;
                case "update":  resp = save(model);                        break;
                case "delete":  resp = remove(model);                      break;
            }

            if (resp) {
                options.success(resp);
            } else {
                options.error("Record not found");
            }
        }
    }
  
    Backbone.sync = function() {
        (model != null && model.hasOwnProperty(model.storageEngine) ?
            Backbone.storageEngines[model.storageEngine] : Backbone.storageEngines['default'])
            .apply(Backbone, arguments)
    };
})(Backbone);