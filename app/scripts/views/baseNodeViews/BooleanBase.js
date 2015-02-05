define(['backbone', 'underscore', 'jquery'],
    function (Backbone, _, $) {

    return {

        extraChanged: function () {
            var ex = this.model.get('extra');
            var value = !!ex.value;

            this.syncUI(value);
            this.model.trigger('updateRunner');
            this.model.workspace.trigger('requestRun');
        },

        clickTrue: function (e) {
            if (this.model.get('extra').value === true)
                return;

            this.valueChanged(true);
            e.stopPropagation();
        },

        clickFalse: function (e) {
            if (this.model.get('extra').value === false)
                return;

            this.valueChanged(false);
            e.stopPropagation();
        },

        syncUI: function (value) {
            if (value) {
                this.$el.find('.true-flag').prop('checked', true);
            }
            else {
                this.$el.find('.false-flag').prop('checked', true);
            }
        },

        valueChanged: function (value) {
            var newValue = {
                value: value
            };

            this.model.workspace.setNodeProperty({
                property: 'extra',
                _id: this.model.get('_id'),
                newValue: newValue
            });

            this.model.workspace.trigger('updateRunner');
        }
    };
});