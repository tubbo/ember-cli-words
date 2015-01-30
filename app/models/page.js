import DS from 'ember-data';
import Ember from 'ember';

export default DS.Model.extend({
  title: DS.attr('string'),
  body: new Ember.Handlebars.SafeString('<span class="loading">Loading Content...</span>')
});
