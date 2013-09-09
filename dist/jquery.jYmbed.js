/*! jYmbed - v0.1-beta - 2013-09-09
* http://ketshup.com.br/jymbed
* Copyright (c) 2013 Luciano Souza; Licensed MIT */

(function($){
	$.fn.jYmbed = function() {
		var $regex = /(\?v=|\&v=|\/\d\/|\/embed\/|\/v\/|\.be\/)([a-zA-Z0-9\-\_]+)/;
		var $attr = {
			width: 560,
			height: 315,
			frameborder: 0,
			allowfullscreen: true
		};

		var $params = {
			autoplay: {
				default: false,
				key: "autoplay",
				value: {
					"false": 0,
					"true": 1
				}
			},
			suggested: {
				default: false,
				key: "rel",
				value: {
					"false": 0,
					"true": 1
				}
			}
		};

		return this.each(function(i, item) {
			var $this = $(item),
				$yid = 0;

			if($this.is("[data-id]")){
				$yid = $this.data("id");
			}else{
				var $yurl = $this.is("[data-url]") ? $this.data("url") : $this.text(),
					$ycheck = $yurl.match($regex);

				if($ycheck){
					$yid = $ycheck[2];
				}
			}

			if($yid){
				var $src = "http://www.youtube.com/embed/" + $yid;
				$attr["width"] = $this.is("[data-width]") ? $this.data("width") : $attr["width"];
				$attr["height"] = $this.is("[data-height]") ? $this.data("height") : $attr["height"];

				var $param = [], $count = 0;
				$.each($params, function(param, object){
					if($this.is("[data-"+ param +"]")){
						$param[$count] = object.key + "=" + object.value[$this.data(param)];
					}
					$count++;
				});

				if($this.is("[data-start]")){
					$param[$count] = "start=" + $this.data("start");
					$count++;
				}

				if($param.length){
					$src = $src + "?" + $param.join("&")
				}

				$attr["src"] = $src;

				var $embed = $("<iframe/>").attr($attr);
				$this.html($embed);
			}
		});
	};
})(jQuery);