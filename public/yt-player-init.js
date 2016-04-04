/**
 * YouTube iframe API code
 *
 * onYouTubeIframeAPIReady() is called by the YT API
 * when it is ready, and it creates a new Player object.
 * The onready() callback just sets a Boolean that we can use for checking later on
 * that the video player is ready to use.
 */

var player;
var playerReady = false;

function onYouTubeIframeAPIReady() {

  player = new YT.Player('player', {
    height: '390',
    width: '640',
    events: {
      'onReady': function(event){
        playerReady = true;
      }
    }
  });
  
}