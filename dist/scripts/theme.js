// Animation variables...
var ta_canvas = null;
var ta_context = null;
var ta_resize_observer = null;
var ta_leavesArray = [];
var ta_gradient = null;

// SMF main jquery one-time ready function...
$(function() {
	$('ul.dropmenu, ul.quickbuttons').superfish({delay : 250, speed: 100, sensitivity : 8, interval : 50, timeout : 1});

	// tooltips
	$('.preview').SMFtooltip();

	// find all nested linked images and turn off the border
	$('a.bbc_link img.bbc_img').parent().css('border', '0');

	// Animation setup...
	ta_canvas = document.getElementById("canvas-body");
	ta_canvas.width = outerWidth;
	ta_canvas.height = outerHeight;
	ta_context = ta_canvas.getContext("2d");

	ta_gradient = ta_context.createLinearGradient(0, 0, 0, ta_canvas.height);
	ta_gradient.addColorStop(0, "#ebd534");
	ta_gradient.addColorStop(0.5, "#eba434");
	ta_gradient.addColorStop(0.75, "#ed5c5c");
	ta_gradient.addColorStop(0.85, "#bf6ff7");
	ta_context.fillStyle = ta_gradient;
	ta_context.fillRect(0, 0, ta_canvas.width, ta_canvas.height);
	generateLeaves(13);

	// If user has opted out of animations, then don't do 'em...
	if (typeof bsc_disable_anim === "undefined")
		anim();

	// Allow coloring of checkbox & radio button backgrounds...
	// This label after all checkboxes guarantees that *ALL* checkboxes 
	// are findable and changeable by .css, and selectable as well.
	// If no ID, gotta create one.
	$("input:checkbox, input:radio").each(function() {
		let $id = this.id;
		if ($id == "")
		{
			$id = "crid_" + Math.random().toString().substring(2, 15) + "_" + Math.random().toString().substring(2, 15);
			this.id = $id;
		}
		$("<label for='" + $id + "'></label>").insertAfter(this);
	});

	// Add a listener for the color pickers, for real-time display...
	$('[id^=cc_]').on('input', function(e) {
		let input_type = e.target.type;
		let color_var = "--" + e.target.id;
		let new_color = e.target.value;
		// Document level = :root...
		if ((input_type === 'color') && (typeof new_color !== undefined))
			document.documentElement.style.setProperty(color_var, new_color);
	});

	// SMF dynamically alters height frequently, so the true doc height isn't always visible to js.
	// This deals with *all* dynamic doc size changes efficiently, including many missed by resize events.
	// And no reload() calls are necessary, so it's fast...  Required for animation.
	ta_resize_observer = new ResizeObserver(entries => {
		for (let entry of entries) {
			ta_canvas.style.width = entry.contentRect.width + "px";
			ta_canvas.style.height = entry.contentRect.width*outerHeight/outerWidth + "px";
			ta_canvas.width = entry.contentRect.width;
			ta_canvas.height = entry.contentRect.width*outerHeight/outerWidth;
			ta_gradient = ta_context.createLinearGradient(0, 0, 0, ta_canvas.height);
			ta_gradient.addColorStop(0, "#ebd534");
			ta_gradient.addColorStop(0.5, "#eba434");
			ta_gradient.addColorStop(0.75, "#ed5c5c");
			ta_gradient.addColorStop(0.85, "#bf6ff7");
			ta_context.fillStyle = ta_gradient;
			ta_context.fillRect(0, 0, ta_canvas.width, ta_canvas.height);
			generateLeaves(13);
		}
	});
	ta_resize_observer.observe(document.body)
});

// Propagate css variables & values into the sceditor iframe document when they hit the wysiwyg button.
// This enables you to manipulate sceditor colors on Current Theme screen.
$(window).on("load", function() {
	$("div.roundframe").on("click", function(e) {
		// User clicked on wysiwyg div...
		if (e.target.parentElement.className !== "sceditor-button sceditor-button-source")
			return;
		let $style = getComputedStyle(document.documentElement);
		let $vars = bsc_css_vars;
		let $frame = $("iframe").contents();
		$vars.forEach(($var) => {
			$frame.find(":root").css($var, $style.getPropertyValue($var));
		});
	});
});

// Propagate css variables into svg images, so the svg palette is kept in sync with the theme.
// For this to work, svg must be loaded via object elements, and the svg itself must use the same 
// variable names in its own internal style sheet.
$(window).on("load", function() {
	$("object[type='image/svg+xml']").each(function() {
		// Get this doc's vars from root...
		let $style = getComputedStyle(document.documentElement);
		let $vars = bsc_css_vars;
		let $svg_doc = this.contentDocument;
		// If no doc to update, move on...
		if ($svg_doc === null)
			return;
		$vars.forEach(($var) => {
			$svg_doc.documentElement.style.setProperty($var, $style.getPropertyValue($var));
		});
		// Substitute forum name where asked...
		$(".smf_mbname_text", $svg_doc).each(function() {
			this.textContent = smf_mbname_text;
		});
	});
});

// Toggles the element height and width styles of an image.
function smc_toggleImageDimensions()
{
	$('.postarea .bbc_img.resized').each(function(index, item)
	{
		$(item).click(function(e)
		{
			$(item).toggleClass('original_size');
		});
	});
}

// Add a load event for the function above.
addLoadEvent(smc_toggleImageDimensions);

function smf_addButton(stripId, image, options)
{
	$('#' + stripId).append(
		'<a href="' + options.sUrl + '" class="button last" ' + ('sCustom' in options ? options.sCustom : '') + ' ' + ('sId' in options ? ' id="' + options.sId + '_text"' : '') + '>'
			+ options.sText +
		'</a>'
	);
}

// Animation functions...
// Animation functions...
// Animation functions...

class Point
{
	x = null;
	y = null;

	constructor(x = 0, y = 0)
	{
		this.x = x;
		this.y = y;
	}

	static add(a, b)
	{
		return new Point(a.x + b.x, a.y + b.y);
	}

	static subtract(a, b)
	{
		return new Point(a.x - b.x, a.y - b.y);
	}

	static distance(a, b)
	{
		let c = this.subtract(a, b);
		return Math.sqrt(Math.pow(c.x, 2) + Math.pow(c.y, 2));
	}
}

class Vector
{
	dist = null;
	angle = null;

	constructor(dist = 0, angle = 0)
	{
		this.dist = dist;
		this.angle = angle;
	}

	// Convert polar to cartesian, & return a Point
	static cart(a)
	{
		let x = Math.cos(a.angle) * a.dist;
		let y = Math.sin(a.angle) * a.dist;
		return new Point(x, y);
	}
 
	// This vector add returns a Point (not a new vector)
	static add(a, b)
	{
		// Convert to cartesian...
		let a_cart = this.cart(a);
		let b_cart = this.cart(b);
		return new Point(Point.add(a_cart, b_cart));
	}

	// This vector transform returns a new vector, scaled per distance & angle increased as requested
	static transform(vector, dist, angle_incr)
	{
		return new Vector(dist * vector.dist, vector.angle + angle_incr);
	}
}

// Draws a shape & fills it.  Assumes you have ta_context already set, & fillstyle.
function Shape()
{
	this.my_path = [
		new Vector(0.25, Math.PI/2),
		new Vector(1, 0),
		new Vector(Math.sqrt(0.125), -Math.PI*3/4),
		new Vector(Math.sqrt(0.125), -Math.PI*1/4),
		new Vector(1, Math.PI)
	];

	// Always move to starting point, then draw the vectors requested, then fill.
	// This will always close the path, so you don't need the last line.
	// Squish must always be from 0 to 1; it fakes 3D by squishing vertically.
	this.draw = (point, size, angle, squish) =>
	{
		let curr_pt = new Point(point.x, point.y);
		let curr_vect = new Vector();
		ta_context.beginPath();
		ta_context.moveTo(curr_pt.x, curr_pt.y);

		this.my_path.forEach((vect) => 
		{
			curr_vect = new Vector(size * vect.dist, angle + vect.angle);
			curr_pt = Point.add(curr_pt, Vector.cart(curr_vect));
			ta_context.lineTo(curr_pt.x, squish*point.y + (1 - squish)*curr_pt.y);
		});

		ta_context.closePath();
		ta_context.fill();
	}
}

function generateColor()
{
	const hexSet = "0123456789ABCDEF";
	let finalHexString = "#";
	for (let i = 0; i < 2; i++)
		finalHexString += hexSet[Math.ceil(Math.random() * 7) + 8];
	finalHexString += "0000";
	return finalHexString;
}

function generateLeaves(amount)
{
	ta_context.fillRect(0, 0, ta_canvas.width, ta_canvas.height);

	for (let i = 0; i < amount; i++)
	{
		ta_leavesArray[i] = new Leaf(
			Math.random() * ta_canvas.width,
			Math.random() * ta_canvas.height,
			Math.random() * ta_canvas.width * .05 + 20,
			generateColor(),
			Math.random() * 0.5 + 0.5,
			Math.random() * Math.PI * 2
		);
 	}
}

function Leaf(x, y, size, color, speed, angle)
{
	this.x = x;
	this.y = y;
	this.size = size;
	this.color = color;
	this.speed = speed;
	this.angle = angle;

	this.fall = () =>
	{
		// Move 'em...
		this.y = this.y + this.speed;

		// Whatdahey, twirl 'em a little...
		this.angle = this.angle + 0.01;

		let angle = this.angle;
		let curr_pt = new Point(this.x, this.y);

		// Create 3 blurry pointy rectangles to emulate a leaf!
		// For depth, fake it...  Just "squish" things vertically...  Close enough...
		ta_context.filter = "blur(3px)";
		ta_context.fillStyle = this.color;

		my_shape = new Shape();
		my_shape.draw(curr_pt, this.size, this.angle, 0.9);
		my_shape.draw(curr_pt, this.size, this.angle + 1, 0.9);
		my_shape.draw(curr_pt, this.size, this.angle - 1, 0.9);

		if (this.y > ta_canvas.height * 1.2)
		{
			this.x = Math.random() * ta_canvas.width;
			this.y = -ta_canvas.height * 0.2;
			this.size = Math.random() * ta_canvas.width * .02 + 50;
			this.color = generateColor();
			this.speed = Math.random() * 0.5 + 0.5;
			this.angle = Math.random() * Math.PI * 2;
		}
	};
}

function anim()
{
	// If ta_context is null, theme is changing due to logon/logoff, etc.
	// Just exit gracefully...
	if (ta_context === null)
		return;

	requestAnimationFrame(anim);

	ta_context.fillStyle = ta_gradient;
	ta_context.fillRect(0, 0, ta_canvas.width, ta_canvas.height);

	ta_leavesArray.forEach((leaf) => leaf.fall());
}
