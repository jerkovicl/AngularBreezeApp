(function () {
    'use strict';

    var app = angular.module('app');

    // Collect the routes
    app.constant('routes', getRoutes());

    // Configure the routes and route resolvers
    app.config(['$routeProvider', 'routes', routeConfigurator]);
    function routeConfigurator($routeProvider, routes) {

        //test invalid routes
        /*
        $routeProvider.when('/pass', {
            templateUrl: 'app/speaker/speakers.html',
            resolve: { fake: fakeAllow } //resolve this first
        });


        $routeProvider.when('/fail', {
            templateUrl: 'app/attendee/attendees.html',
            resolve: { 
                fake: fakeReject //resolve this first
                //you can have multiple resolvers here
            } 
        });

        //allow
        fakeAllow.$inject = ['$q'];
        function fakeAllow($q) {
            var data = { x: 1 };
            var defer = $q.defer();
            defer.resolve(data); 
            return defer.promise; //return promise
        }

        //reject
        fakeReject.$inject = ['$q'];
        function fakeReject($q) {
            
            var defer = $q.defer();
            defer.reject({msg: 'Cant pass'}); 
            return defer.promise; //return promise
        }

        
       
        $routeProvider.when('/invalid', {
            templateUrl: 'app/invalid.html'
        });
        */

        routes.forEach(function (r) {
            // $routeProvider.when(r.url, r.config);
            setRoute(r.url, r.config);
        });
        $routeProvider.otherwise({ redirectTo: '/' });
        
        function setRoute(url, definition) {
            //Sets resolvers for all of the routes
            //by extending any existing  resolvers (or creating new ones)
            definition.resolve = angular.extend(definition.resolve || {}, {
                prime:prime
            });
            $routeProvider.when(url, definition);
            return $routeProvider;
        }
    }

    prime.$inject = ['datacontext'];
    function prime(dc) {
        return dc.prime();
    }
   
 

    // Define the routes 
    function getRoutes() {
        return [
            {
                url: '/',
                config: {
                    templateUrl: 'app/dashboard/dashboard.html',
                    title: 'dashboard',
                    settings: {
                        nav: 1,
                        content: '<i class="icon-dashboard"></i> Dashboard'
                    }
                }
         
                //sessions route
            }, {
                url: '/sessions',
                config: {
                    title: 'sessions',
                    templateUrl: 'app/session/sessions.html',
                    settings: {
                        nav: 2,
                        content: '<i class="icon-calendar"></i> Sessions'
                    }
                }

                //sessions search route
            }, {
                url: '/sessions/search/:search',
                config: {
                    title: 'sessions-search',
                    templateUrl: 'app/session/sessions.html',
                    settings: {}
                }
             

                //speakers route
            }, {
                url: '/speakers',
                config: {
                    title: 'speakers',
                    templateUrl: 'app/speaker/speakers.html',
                    settings: {
                        nav: 3,
                        content: '<i class="icon-user"></i> Speakers'
                    }
                }
                //attendees route
            }, {
                url: '/attendees',
                config: {
                    title: 'attendees',
                    templateUrl: 'app/attendee/attendees.html',
                    settings: {
                        nav: 4,
                        content: '<i class="icon-user"></i> Attendees'
                    }
                }
            }
        ];
    }
})();