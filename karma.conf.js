module.exports = function (config) {
    config.set({

        basePath: '',

        frameworks: ['mocha', 'requirejs', 'sinon'],

        files: [
            'test/uiSpecs/testMain.js',
            'public/css/*.css',

            {pattern: 'test/uiSpecs/fixtures/**/*' /*, included: false*/},

            {pattern: 'public/js/libs/*.js', included: false, watching: false},
            {pattern: 'public/js/libs/**/*.js', included: false, watching: false},

            {pattern: 'test/uiSpecs/jqueryPrivate.js', included: false, watching: false},
            /*{pattern: 'public/js/populate.js', included: false, watching: false},
             {pattern: 'public/js/dataService.js', included: false, watching: false},
             {pattern: 'public/js/router.js', included: false, watching: false},*/

            {pattern: 'node_modules/chai/chai.js', included: false, watching: false},
            {pattern: 'node_modules/chai-jquery/chai-jquery.js', included: false, watching: false},
            {pattern: 'node_modules/sinon-chai/lib/sinon-chai.js', included: false, watching: false},

            {pattern: 'constants/test/*.js', included: false, watching: false},

            {pattern: 'public/js/Validation.js', included: false, watching: false},
            {pattern: 'public/js/collections/**/*.js', included: false, watching: false},
            {pattern: 'public/js/models/*.js', included: false, watching: false},
            {pattern: 'public/js/helpers/*.js', included: false, watching: false},
            {pattern: 'public/js/views/**/*.js', included: false, watching: false},
            {pattern: 'public/templates/**/*.html', included: false, watching: false},
            {pattern: 'public/js/*.js', included: false, watching: false},

            {pattern: 'test/uiSpecs/collection/*.test.js', included: false/*, watching: true*/},
            {pattern: 'test/uiSpecs/fixtures/*.test.js', included: false/*, watching: true*/},
            {pattern: 'test/uiSpecs/models/*.test.js', included: false/*, watching: true*/},
            {pattern: 'test/uiSpecs/views/login.test.js', included: false/*, watching: true*/},
            {pattern: 'test/uiSpecs/views/dashboardVacation.test.js', included: false/*, watching: true*/}

            //{pattern: 'test/uiSpecs/**/*.test.js', included: false/*, watching: true*/}
        ],

        exclude: [],

        preprocessors: {
            'public/js/models/**/*.js'     : ['coverage'],
            'public/js/views/**/*.js'      : ['coverage'],
            'public/js/collections/**/*.js': ['coverage']
        },

        coverageReporter: {
            type: 'html',
            dir : 'coverage/'
        },

        reporters: ['progress', 'coverage'],

        port: 9876,

        colors: true,

        logLevel: config.LOG_INFO,

        /* autoWatch: true,*/

        browsers: ['Firefox', 'Chrome', /* 'Safari', 'IE',*/ 'PhantomJS'],

        singleRun: false,

        client: {
            mocha: {
                ui: 'bdd'
            }
        },

        concurrency: Infinity
    });
};
