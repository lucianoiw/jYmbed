/*! jYmbed - v0.12-beta - 2013-11-03
* http://ketshup.com.br/jymbed
* Copyright (c) 2013 Luciano Souza; Licensed MIT */

(function($){
	$.fn.jYmbed = function($config) {
		var $regex = /(\?v=|\&v=|\/\d\/|\/embed\/|\/v\/|\.be\/)([a-zA-Z0-9\-\_]+)/;

        var $defaults = {
			width: 560,
			height: 315,
			autoplay: 0,
			rel: 0,
			color: "red",
			controls: 1,
			showinfo: 1,
			autohide: 2,
			loop : 0,
			start: -1,
			theme: "dark"
        };

        var $options = $.extend({}, $defaults, $config);

		var $callbacks = {};
		if($options){
			$.each($options, function(i, item){
				if(jQuery.isFunction(item)){
					$callbacks[i] = item;
				}
			});
		};

		$dependences = {};

		var $youtube_api = function($callback){
			if(typeof window.$youtube_api_initialized !== "undefined"){
				$callback();
			}else{
		        $.getScript("//www.youtube.com/iframe_api")
		        .done(function(script, textStatus) {
		        	YT.ready(function(){
			        	window.$youtube_api_initialized = true;
			        	$callback();
			        });
		        })
		        .fail(function(jqxhr, settings, exception) {
		            console.error("An error occurred while trying to download youtube's API.");
		        });
			}
		};

		var $youtube_playing = function($player, $player_id, $video_id){
			var $total = $player.getDuration();
			var $fractions = $total / 4;
			var $position = $player.getCurrentTime();
			var $percent = null;

			if($position > 0 && $position <= $fractions){
				$percent = 0;
			}else if($position > $fractions && $position <= ($fractions*2)){
				$percent = 25;
			}else if($position > ($fractions*2) && $position <= ($fractions*3)){
				$percent = 50;
			}else if($position > ($fractions*3) && $position <= ($fractions*4)){
				$percent = 75;
			}

			if(typeof $dependences[$player_id].onPlaybackViewPercent !== "undefined"){
				if($dependences[$player_id].onPlaybackViewPercent !== $percent){
					$dependences[$player_id].onPlaybackViewPercent = $percent;

					if((typeof $callbacks.onPlaybackView !== "undefined") && $percent){
						$callbacks.onPlaybackView($percent, $player, $player_id, $video_id);
					}
				}
			}
		};

		var $youtube_state_change = function(event, $player, $player_id, $video_id){
			if(typeof $callbacks.onStateChange !== "undefined"){
				if(event.data == 0){
					clearTimeout($dependences[$player_id].onStateChangeTimeout);
				}

				$dependences[$player_id].onStateChangeTimeout = setTimeout(function(){
					clearTimeout($dependences[$player_id].onStateChangeTimeout);

					var $state = ["end", "play", "pause", "buffer", "cued"];
					$callbacks.onStateChange(((typeof $state[event.data] !== "undefined") ? $state[event.data] : "unstarted"), $player, $player_id, $video_id);
				}, 500);
			}
		};

		var $this = this;
		$youtube_api(function(){
			return $this.each(function(i, item) {
				var $video = $(item);

				if(!$video.is("[data-playerInitialized]")){
					var $video_id = null;
					if($video.is("[data-videoId]")){
						$video_id = $video.attr("data-videoId");
					}else{
						var $video_url = $video.is("[data-videoUrl]") ? $video.attr("data-videoUrl") : $video.text();
						var $video_url_parse = $video_url.match($regex);

						if($video_url_parse){
							$video_id = $video_url_parse[2];
						}
					}

					if($video_id){
						var $player_random = Math.ceil((Math.random()*9999)+1);
						var $player_id = $video.is("[id]") ? $video.attr("id") : ("player-" + $player_random);
						$video.attr("id", $player_id);

						$dependences[$player_id] = {};
						$dependences[$player_id].onPlaybackViewInterval = 0;
						$dependences[$player_id].onPlaybackViewPercent = null;
						$dependences[$player_id].onStateChangeTimeout = 0;

						var $videoOptions = {};
						$.each($defaults, function(key, value){
							$videoOptions[key] = $video.is("[data-" + key + "]") ? $video.attr("data-" + key) : $options[key];
						});

						$videoOptions["autoplay"] = $videoOptions["autoplay"] == "true" ? 1 : 0;
						$videoOptions["rel"] = $videoOptions["rel"] == "true" ? 1 : 0;
						$videoOptions["color"] = (jQuery.inArray($videoOptions["color"], ["red", "white"]) < 0 ) ? $videoOptions["color"] : "red";
						$videoOptions["controls"] = $videoOptions["controls"] == "true" ? 1 : 0;
						$videoOptions["showinfo"] = $videoOptions["showinfo"] == "true" ? 1 : 0;
						$videoOptions["autohide"] = (jQuery.inArray($videoOptions["autohide"], ["0", "1", "2"]) >= 0) ? $videoOptions["autohide"] : "2";
						$videoOptions["loop"] = $videoOptions["loop"] == "true" ? 1 : 0;
						$videoOptions["start"] = $.isNumeric($videoOptions["start"]) ? $videoOptions["start"] : -1;
						$videoOptions["theme"] = (jQuery.inArray($videoOptions["theme"], ["light", "dark"]) >= 0) ? $videoOptions["theme"] : "dark";

						var $player = new YT.Player($player_id, {
							videoId: $video_id,
							width: $videoOptions["width"],
							height: $videoOptions["height"],
							playerVars: {
								autoplay: $videoOptions["autoplay"],
								rel: $videoOptions["rel"],
								color: $videoOptions["color"],
								controls: $videoOptions["controls"],
								showinfo: $videoOptions["showinfo"],
								autohide: $videoOptions["autohide"],
								loop: $videoOptions["loop"],
								start: $videoOptions["start"],
								theme: $videoOptions["theme"]
							},
							events: {
								'onReady': function(event){
									if(typeof $callbacks.onReady !== "undefined"){
										$callbacks.onReady(event, $player, $player_id, $video_id);
									}
								},
								'onStateChange': function(event){
									$youtube_state_change(event, $player, $player_id, $video_id);

									if(typeof $callbacks.onPlaybackView !== undefined){
										if(event.data == 0) {
											clearInterval($dependences[$player_id].onPlaybackViewInterval);
										}
										else if(event.data == 1) {
											$dependences[$player_id].onPlaybackViewInterval = setInterval(function(){
												$youtube_playing($player, $player_id, $video_id);
											}, 800);
										}
										else if(event.data == 2) {
											clearInterval($dependences[$player_id].onPlaybackViewInterval);
										}
									}
								},
								'onPlaybackQualityChange': function(event){
									if(typeof $callbacks.onPlaybackQualityChange !== "undefined"){
										$callbacks.onPlaybackQualityChange(event.data, $player, $player_id, $video_id);
									}
								},
								'onPlaybackRateChange': function(event){
									if(typeof $callbacks.onPlaybackRateChange !== "undefined"){
										$callbacks.onPlaybackRateChange(event, $player, $player_id, $video_id);
									}
								}
							}
						});

						$video.attr("data-playerInitialized", true);
					}
				}
			});
		});
	};
})(jQuery);