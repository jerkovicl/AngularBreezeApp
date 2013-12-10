(function () {
    'use strict';

    var serviceId = 'datacontext';
    angular.module('app').factory(serviceId,
        ['common', 'entityManagerFactory', 'model', datacontext]);

    function datacontext(common, emFactory, model) {
        var Predicate = breeze.Predicate;
        var EntityQuery = breeze.EntityQuery;
        var entityNames = model.entityNames;
        var getLogFn = common.logger.getLogFn;
        var log = getLogFn(serviceId);
        var logError = getLogFn(serviceId, 'error');
        var logSuccess = getLogFn(serviceId, 'success');
        var manager = emFactory.newManager();
        var primePromise;
        var $q = common.$q;

        var storeMeta = {
            isLoaded: {
                sessions: false,
                attendees: false
            }
        };

        

        var service = {
            getAttendees: getAttendees,
            getAttendeeCount: getAttendeeCount,
            getFilteredCount: getFilteredCount,
            getPeople: getPeople,
            getMessageCount: getMessageCount,
            getSessionCount: getSessionCount,
            getSpeakersLocal: getSpeakersLocal,
            getSessionPartials: getSessionPartials,
            getSpeakerPartials: getSpeakerPartials,
            getSpeakersTopLocal: getSpeakersTopLocal,
            getTrackCounts: getTrackCounts,
            prime: prime
        };

        return service;

        function getMessageCount() { return $q.when(72); }

        function getPeople() {
            var people = [
                { firstName: 'John', lastName: 'Papa', age: 25, location: 'Florida' },
                { firstName: 'Ward', lastName: 'Bell', age: 31, location: 'California' },
                { firstName: 'Colleen', lastName: 'Jones', age: 21, location: 'New York' },
                { firstName: 'Madelyn', lastName: 'Green', age: 18, location: 'North Dakota' },
                { firstName: 'Ella', lastName: 'Jobs', age: 18, location: 'South Dakota' },
                { firstName: 'Landon', lastName: 'Gates', age: 11, location: 'South Carolina' },
                { firstName: 'Haley', lastName: 'Guthrie', age: 35, location: 'Wyoming' }
            ];
            return $q.when(people);
        }

        function getSpeakerPartials(forceRemote) {
            var predicate = Predicate.create('isSpeaker', '==', true); //define predicate to filter query
            var speakerOrderBy = 'firstName, lastName';
            var speakers = [];

            if (!forceRemote) {
                //get local data
                speakers = _getAllLocal(entityNames.speaker, speakerOrderBy, predicate );
                return $q.when(speakers); //$q.when resolves the promise and passes a value back
            }

            return EntityQuery.from('Speakers')
            .select('id, firstName, lastName, imageSource')
            .orderBy(speakerOrderBy)
            .toType(entityNames.speaker)
            .using(manager).execute()
            .to$q(querySucceeded, _queryFailed);

            function querySucceeded(data) {
                speakers = data.results;
                for (var i = speakers.length; i--;) {
                    speakers[i].isSpeaker = true;
                }
                log('Retrieved [Speaker Partials] from remote data source', speakers.length, true);
                return speakers;
            }
        }

        function getAttendees(forceRemote, page, size, nameFilter) {
            var orderBy = 'firstName, lastName';
            //var attendees = [];
            //number to get back
            var take = size || 20;
            //number to skip 
            var skip = page ? (page - 1) * size : 0;

            if (_areAttendeesLoaded() && !forceRemote) {
                /*
                //get all local data
                attendees = _getAllLocal(entityNames.attendee, orderBy);
                return $q.when(attendees); //$q.when resolves the promise and passes a value back
                */
                //get only data for page according to take & skip
                return $q.when(getByPage());
                
            }

            return EntityQuery.from('Persons')
                .select('id, firstName, lastName, imageSource')
                .orderBy(orderBy)
                .toType(entityNames.attendee) //what entity type to use for partials projection
                .using(manager).execute()
                .to$q(querySucceeded, _queryFailed);

            function getByPage() {
                var predicate = null;
                if (nameFilter) {
                    predicate = _fullNamePredicate(nameFilter); //functions with _(underscore) always private
                }
                var attendees = EntityQuery.from(entityNames.attendee)
                .where(predicate)
                .take(take)
                .skip(skip)
                .orderBy(orderBy)
                .using(manager)
                .executeLocally();
                
                return attendees;
            }

            function querySucceeded(data) {
                //attendees = data.results;
                _areAttendeesLoaded(true);
                log('Retrieved [Attendees] from remote data source', data.results.length, true);
                return getByPage();
            }
        }

        function getAttendeeCount() {
            if(_areAttendeesLoaded()) {
                return $q.when(_getLocalEntityCount(entityNames.attendee)); //will return a promise with the count
            }
            //Attendees aren't loaded ask the server for a count
            return EntityQuery.from('Persons').take(0).inlineCount()
            .using(manager).execute()
            .to$q(_getInlineCount);
        }

        function getSessionCount() {
            if (_areSessionsLoaded()) {
                return $q.when(_getLocalEntityCount(entityNames.session)); //will return a promise with the count
            }
            //Sessions aren't loaded ask the server for a count
            return EntityQuery.from('Sessions').take(0).inlineCount()
            .using(manager).execute()
            .to$q(_getInlineCount);
        }

        function getTrackCounts() {
            return getSessionPartials().then(function(data){
                var sessions = data;
                //loop through the sessions and create a mapped track counter object
                //ES5's .reduce() function will help create the mapped object showing the tracks and their session counts
                var trackMap = sessions.reduce(function (accum, session) { 
                    var trackName = session.track.name;
                    var trackId = session.track.id;
                    if(accum[trackId-1]) {
                        accum[trackId - 1].count++;
                    }
                    else {
                        accum[trackId - 1] = {
                            track: trackName,
                            count: 1
                        };
                    }
                    return accum;
                }, []);
                return trackMap;
            });
        }

        function getSpeakersLocal() {
            var orderBy = 'firstName, lastName';
            var predicate = Predicate.create('isSpeaker', '==', true);
            return _getAllLocal(entityNames.speaker, orderBy, predicate);
        }

        function getSpeakersTopLocal() {
            var orderBy = 'firstName, lastName';
            var predicate = Predicate.create('lastName', '==', 'Papa')
            .or('lastName', '==', 'Guthrie')
            .or('lastName', '==', 'Bell')
            .or('lastName', '==', 'Hanselman')
            .or('lastName', '==', 'Lerman')
            .and('isSpeaker', '==', true);
            return _getAllLocal(entityNames.speaker, orderBy, predicate);
        }

        //queries the local cache for an entity count
        function _getLocalEntityCount(resource) {
            var entities = EntityQuery.from(resource)
            .using(manager)
            .executeLocally();
            return entities.length;
        }

        function _getInlineCount(data) {
            return data.inlineCount;
        }

        function getFilteredCount (nameFilter) {
            var predicate = _fullNamePredicate(nameFilter);

            var attendees = EntityQuery.from(entityNames.attendee)
               .where(predicate)
               .using(manager)
               .executeLocally();

            return attendees.length;
        }

        function _fullNamePredicate(filterValue) {
            return Predicate.create('firstName', 'contains', filterValue).or('lastName', 'contains', filterValue);
        }

        function getSessionPartials(forceRemote) {
            var orderBy = 'timeSlotId, level, speaker.firstName';
            var sessions;

            if(_areSessionsLoaded() && !forceRemote) {
                //get local data
                sessions = _getAllLocal(entityNames.session, orderBy);
                return $q.when(sessions); //$q.when resolves the promise and passes a value back
            }

            return EntityQuery.from('Sessions')
                .select('id, title, code, speakerId, trackId, timeSlotId, roomId, level, tags')
                .orderBy(orderBy)
                .toType(entityNames.session) //what entity type to use for partials projection
                .using(manager).execute()
                .to$q(querySucceeded, _queryFailed);

            function querySucceeded(data) {
                sessions = data.results;
                _areSessionsLoaded(true);
                log('Retrieved [Session Partials] from remote data source', sessions.length, true);
                return sessions;
            }
        }

        function prime() {
            if (primePromise) return primePromise;

            primePromise = $q.all([getLookups(), getSpeakerPartials(true)])
                .then(extendMetadata)
                .then(success);
            return primePromise;

            function success() {
                setLookups();
                log('Primed the data');
            }

            function extendMetadata() {
                var metadataStore = manager.metadataStore; //Breeze metadata store contains information about entities
                var types = metadataStore.getEntityTypes();
                types.forEach(function (type) {
                    if (type instanceof breeze.EntityType) {
                        set(type.shortName, type)
                    }
                });

                var personEntityName = entityNames.person;
                ['Speakers', 'Speaker', 'Attendees', 'Attendee'].forEach(function (r) {
                    set(r, personEntityName);
                });
                function set(resourceName, entityName) {
                    metadataStore.setEntityTypeForResourceName(resourceName, entityName);
                }

            }
        }

        function setLookups() {

            service.lookupCachedData = {
                rooms: _getAllLocal(entityNames.room, 'name'),
                tracks: _getAllLocal(entityNames.track, 'name'),
                timeslots: _getAllLocal(entityNames.timeslot, 'start')
            };
        }

        function _getAllLocal(resource, ordering, predicate) {
            return EntityQuery.from(resource)
                .orderBy(ordering)
                .where(predicate) //using predicate (condition) to filter query
                .using(manager)
                .executeLocally();
        }

        function getLookups() {
            return EntityQuery.from('Lookups')
            .using(manager).execute()
            .to$q(querySucceeded, _queryFailed);

            function querySucceeded(data) {

                log('Retrieved [Lookups]', data, true);
                return true;
            }

        }

        function _queryFailed(error) {
            var msg = config.appErrorPrefix + 'Error retrieving data.' + error.message;
            logError(msg, error);
            throw error;

        }

        function _areSessionsLoaded(value) {
            return _areItemsLoaded('sessions', value);
        }

        function _areAttendeesLoaded(value) {
            return _areItemsLoaded('attendees', value);
        }

        function _areItemsLoaded(key, value) {
            if(value === undefined) {
                return storeMeta.isLoaded[key]; //get 
            }
            return storeMeta.isLoaded[key] = value; //set
        }
    }

})();