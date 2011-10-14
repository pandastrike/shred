describe('REST API Tutorial', function () {
  describe('Initialization', function(){
    describe('Surf', function(){
      it('should exist', function(){
        expect(Surf).toBeDefined();
      });

      it('should not throw', function(){
        expect(function(){
          new Surf()
        }).not.toThrow();
      });
    });
  }); // describe('initialization', function(){ ...

  describe('Discovery', function(){
    var surfer;

    beforeEach(function () {
      surfer = new Surf();
    });

    describe('surfer.get', function(){
      it('should exist', function(){
        expect(surfer.get).toBeDefined();
      });

      it('should not throw', function(){
        expect(function(){
          surfer.get({
            url: "http://waves.io/",
            headers: {
              accept: "application/json",
              origin: "http://yourdomain.com"
            },
            on: {
              response: function(response) {
                resources = response.content.data;
                // assert.ok(resources.sessions.url);
              }
            }
          });
        }).not.toThrow();
      });
    });

    // surfer.get({
    //   url: "http://waves.io/",
    //   headers: {
    //     accept: "application/json",
    //     origin: "http://yourdomain.com"
    //   },
    //   on: {
    //     response: function(response) {
    //       resources = response.content.data;
    //       assert.ok(resources.sessions.url);
    //     }
    //   }
    // });
  });
});
