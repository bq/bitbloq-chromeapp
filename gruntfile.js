'use strict';
module.exports = function(grunt) {
    //load grunt tasks
    require('load-grunt-tasks')(grunt);

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: {
                src: [
                    'gruntfile.js',
                    'app/**/*.js'
                ]
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    cwd: 'app/',
                    src: ['manifest.json', 'icons/**'],
                    dest: 'dist/'
                }]
            }
        },
        clean: {
            dist: ['dist/*']
        },
        exec: {
            browserify: 'browserify app/background.js -o dist/background.bundle.js'
        },
        watch: {
            files: ['app/**/*.*'],
            tasks: ['dist'],
            options: {
                atBegin: true,
                interrupt: true
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', function() {
        grunt.task.run([
            'dist'
        ]);
    });

    grunt.registerTask('dist', function() {
        grunt.task.run([
            'jshint:all',
            'clean:dist',
            'copy:dist',
            'exec:browserify'
        ]);
    });

};