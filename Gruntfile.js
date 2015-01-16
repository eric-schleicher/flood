'use strict';
var lrSnippet = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
// templateFramework: 'lodash'

module.exports = function (grunt) {
    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist'
    };

    grunt.initConfig({
        yeoman: yeomanConfig,
        clean: {
            dist: ['.tmp', '<%= yeoman.dist %>/*'],
            server: '.tmp'
        },
        replace: {
            mongo2base: {
                src: ['app/scripts/config.js'],
                overwrite: true,
                replacements: [{
                  from: "Storage: 'helpers/MongoStorage'",
                  to: "Storage: 'helpers/BaseStorage'"
                }]
            },
            base2mongo: {
                src: ['app/scripts/config.js'],
                overwrite: true,
                replacements: [{
                  from: "Storage: 'helpers/BaseStorage'",
                  to: "Storage: 'helpers/MongoStorage'"
                }]
            },
            nwksaveuploader2base: {
                src: ['app/scripts/config.js'],
                overwrite: true,
                replacements: [{
                  from: "SaveUploader: 'models/NWKSaveUploader'",
                  to: "SaveUploader: 'models/BaseSaveUploader'"
                }, {
                  from: "SaveUploaderView: 'views/NWKSaveUploaderView'",
                  to: "SaveUploaderView: 'views/BaseSaveUploaderView'"
                }]
            },
            basesaveuploader2nwk: {
                src: ['app/scripts/config.js'],
                overwrite: true,
                replacements: [{
                  from: "SaveUploader: 'models/BaseSaveUploader'",
                  to: "SaveUploader: 'models/NWKSaveUploader'"
                }, {
                  from: "SaveUploaderView: 'views/BaseSaveUploaderView'",
                  to: "SaveUploaderView: 'views/NWKSaveUploaderView'"
                }]
            }
        },
        // This task uses James Burke's excellent r.js AMD builder to take all
        // modules and concatenate them into a single file.
        requirejs: {
          release: {
            options: {

              mainConfigFile: "app/scripts/config.js",

              include: ["main"],
              insertRequire: ["main"],

              out: "dist/source.min.js",
              optimize: "uglify",

              // Since we bootstrap with nested `require` calls this option allows
              // R.js to find them.
              findNestedDependencies: true,

              // Include a minimal AMD implementation shim.
              name: "almond",

              // Setting the base url to the distribution directory allows the
              // Uglify minification process to correctly map paths for Source
              // Maps.
              baseUrl: "app/scripts",

              // Wrap everything in an IIFE.
              wrap: true,

              // Do not preserve any license comments when working with source
              // maps.  These options are incompatible.
              preserveLicenseComments: true
            }
          },
          customizer: {
            options: {

              mainConfigFile: "app/scripts/config.js",

              include: ["customizer"],
              insertRequire: ["customizer"],

              out: "dist/customizer.min.js",
              optimize: "uglify",
              findNestedDependencies: true,
              name: "almond",
              baseUrl: "app/scripts",
              wrap: true,
              preserveLicenseComments: true
            }
          }
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg,gif}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            },
            jqueryui: {
                files: [{
                    expand: true,
                    flatten: true,
                    cwd: '<%= yeoman.app %>',
                    src: 'bower_components/jquery.ui/themes/base/images/*.png',
                    dest: '<%= yeoman.dist %>/styles/images'
                }]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/style.min.css': [                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/bower_components/jquery.ui/themes/base/*.css',
                        '<%= yeoman.app %>/bower_components/components-font-awesome/css/font-awesome.min.css',
                        '<%= yeoman.app %>/styles/bootstrap.css',
                        '<%= yeoman.app %>/styles/main.css',
                    ],
                    '<%= yeoman.dist %>/customizer.min.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/bower_components/jquery.ui/themes/base/*.css',
                        '<%= yeoman.app %>/bower_components/components-font-awesome/css/font-awesome.min.css',
                        '<%= yeoman.app %>/styles/bootstrap.css',
                        '<%= yeoman.app %>/styles/main.css',
                        '<%= yeoman.app %>/styles/customizer.css'
                    ]
                }
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,txt}',
                        '.htaccess',
                        '*.html',
                        '*.json',
                        'images/{,*/}*.{webp,gif,png}',
                        'bower_components/jquery/jquery.min.js',
                        'bower_components/components-font-awesome/css/font-awesome.min.css',
                        'bower_components/components-font-awesome/fonts/*.{ttf,eot,svg,woff,otf}',
                        'scripts/lib/flood/*.js',
						'scripts/helpers/Settings.js'
                    ]
                }]
            },
            fonts: {
                files: [{
                    expand: true,
                    dot: true,
                    flatten: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>/fonts',
                    src: [
                        'bower_components/components-font-awesome/fonts/*.{ttf,eot,svg,woff,otf}'
                    ]
                }]
            }
        },
        bower: {
            all: {
                rjsConfig: '<%= yeoman.app %>/scripts/main.js'
            }
        },
        processhtml: {
          release: {
            files: {
              "dist/app.html": ["app/app.html"],
              "dist/customizer.html": ["app/customizer.html"]
            }
          },
          selenium: {
            files: {
              "dist/start.html": ["app/start.html"]
            }
          }
        },
        nodewebkit: {
            options: {
                version: '0.8.1',
                build_dir: './dist_desktop', // Where the build version of my node-webkit app is saved
                mac: true, // We want to build it for mac
                win: true, // We want to build it for win
                linux32: false, // We don't need linux32
                linux64: false // We don't need linux64
            },
            src: ['./dist/**'] // Your node-wekit app
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'replace:mongo2base',
        'replace:basesaveuploader2nwk',
        'requirejs',
        'imagemin',
        'cssmin',
        'copy',
        'processhtml:release',
        'replace:base2mongo',
        'replace:nwksaveuploader2base'
    ]);

    grunt.registerTask('desktop', [
        'clean:dist',
        'replace:mongo2base',
        'replace:basesaveuploader2nwk',
        'requirejs',
        'imagemin',
        'cssmin',
        'copy',
        'processhtml:release',
        'replace:base2mongo',
        'replace:nwksaveuploader2base',
        'nodewebkit'
    ]);

    grunt.registerTask('desktop_selenium', [
        'processhtml:selenium',
    ]);

    grunt.registerTask('desktop_dynamo', [
        'nodewebkit'
    ]);

    grunt.registerTask('default', [
        'build'
    ]);
};
