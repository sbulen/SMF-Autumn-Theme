<?php
/**
 * Load some js vars
 */
function add_bsc_theme_jsvars()
{
	global $options, $mbname, $settings;

	// Let the animation know if you want it to shut up...
	if (!empty($options['bsc_disable_animations']))
		addJavaScriptVar('bsc_disable_anim', 1);

	// Helps with svgs that display forum name...
	addJavaScriptVar('smf_mbname_text', $mbname, true);

	// Not all browsers make it easy to find your CSS vars...
	// So...  Just pass 'em...
	$vars = array();
	foreach ($settings['color_palettes']['default'] AS $var => $val)
		$vars[] = '--cc_' . $var;
	addJavaScriptVar('bsc_css_vars', $vars, true);
}
?>