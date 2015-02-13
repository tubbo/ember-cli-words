/* global require, module */

var marked = require('marked'),
    fs = require('fs'),
    path = require('path'),
    root = require('app-root-path'),
    yaml = require('js-yaml'),
    merge = require('merge'),
    reject = require('reject'),
    cheerio = require('cheerio'),
    pygments = require('pygmentize-bundled');

/**
 * A template compiler engine which reads a source in Markdown and Front
 * Matter and exports it to HTML and an attributes object (respectively).
 * This function takes a collection and Markdown filename and uses it to
 * instantiate a new Template object from the prototype.
 *
 * @param {Collection} collection - A collection of articles which this
 * template was instantiated from. Includes some folder-specific data we
 * need to compile this template.
 * @param {string} filename - Serves as the ID for this Template and is
 * used to create the source and destination file paths.
 *
 * @constructor
 */
var Template = function(collection, filename) {
  this.collection = collection;
  this.id = filename;
  this.source = path.join(root.path, collection.source, filename+'.md');
  var destinationPath = path.join(root.path, collection.destination, filename);
  this.destination = destinationPath+'.html';
  this.preview = destinationPath+'.preview.html';
  this.json = destinationPath+'.json';
  this.key = this.collection.key.split('s').join('');
};

/**
 * Compiles the Markdown source to HTML and writes that output to the
 * destination file. Returns nothing since this is an asynchronous
 * operation.
 *
 * Compiles Article Markdown contents to HTML using the excellent Marked
 * library.
 *
 * @returns {string} the HTML result of the compiled article template
 */
Template.prototype.compile = function() {
  var articleFilename = this.destination,
      previewFilename = this.preview,
      metadataFilename = this.json;

  var metadata = {};
  metadata[this.key] = this.attributes();

  marked(this.toMarkdown(), {
    gfm: true,
    highlight: function (code, lang, callback) {
      var opts = { lang: lang, format: 'html' };
      pygments(opts, code, function(error, result) {
        callback(error, result.toString());
      });
    }
  }, function(error, html) {
    if (error) {
      throw error;
    }
    var $ = cheerio.load(html);
    fs.writeFile(articleFilename, html);
    fs.writeFile(previewFilename, $('p').first().html());
  });
  fs.writeFile(metadataFilename, JSON.stringify(metadata));
};

/**
 * Finds Article attributes from the YAML front matter using the YAML.js
 * library to parse it into a hash of attributes.
 *
 * @returns {object} the metadata for this article in key/value pairs.
 */
Template.prototype.attributes = function() {
  return merge({ id: this.id }, yaml.safeLoad(this.toYAML()));
};

/**
 * Reads article contents and tokenizes it using the delimiter '---'.
 *
 * @returns {array} the tokenized article contents.
 */
Template.prototype.contents = function() {
  return fs.readFileSync(this.source).toString().split('---');
};

/**
 * Returns the last part of the output of contents() which is the
 * Markdown source of this Article.
 *
 * @returns {string} the source of this Article in Markdown.
 */
Template.prototype.toMarkdown = function() {
  return this.contents()[2];
};

/**
 * The raw YAML front matter used to give this Article some metadata.
 *
 * @returns {string} the raw YAML front matter.
 */
Template.prototype.toYAML = function() {
  return this.contents()[1];
};

module.exports = Template;
