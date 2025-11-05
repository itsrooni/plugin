<?php
namespace TWS\WBE;

if (!defined('ABSPATH')) exit;

class Helper {
    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        // Apply computed price to cart line items
        add_action('woocommerce_before_calculate_totals', [$this, 'apply_custom_price'], 20);
        // Show selections on cart/checkout
        add_filter('woocommerce_get_item_data', [$this, 'display_item_meta'], 10, 2);
    }

    /** Parse first money-looking number into float */
    public static function parse_money($str) {
        $n = preg_replace('/[^0-9\.\-]/', '', (string)$str);
        return ($n !== '' && is_numeric($n)) ? (float)$n : 0.0;
    }

    /** Extract <span id="X">...</span> value from HTML */
    public static function extract_span($html, $id) {
        if (preg_match('#<span[^>]*id=["\']'.preg_quote($id,'#').'["\'][^>]*>(.*?)</span>#is', $html, $m)) {
            return trim(wp_strip_all_tags($m[1]));
        }
        return '';
    }

    /** Canonical spec string for SKU hashing */
    public static function canon_spec(array $s) {
        $order = [
            'Manufacturer','frame','type','SubType','SizeInput','ROSize','Width','WidthSixteenth','Height','HeightSixteenth',
            'finish','FrameOption','grid','Glass','GlassOptionsARG','GlassOptionsTEMP','GlassOptionsSCMAX','GlassOptionsT24',
            'OtherBRTU','OtherSSA','OtherTRIM','OtherPTS','location','notes'
        ];
        $parts = [];
        foreach ($order as $k) {
            if (isset($s[$k])) {
                $v = is_array($s[$k]) ? implode(',', $s[$k]) : $s[$k];
                $parts[] = $k.'='.$v;
            }
        }
        return implode('|', $parts);
    }

    /** Generate readable product name from selections */
    public static function product_name(array $s) {
        $m = $s['Manufacturer'] ?? '';
        $f = $s['frame'] ?? '';
        $t = $s['type'] ?? '';
        $st= $s['SubType'] ?? '';
        $size = ($s['SizeInput'] ?? '') === 'NFS'
            ? (($s['Width'] ?? '').'" x '.($s['Height'] ?? '').'" NFS')
            : (($s['ROSize'] ?? '') ? 'RO '.$s['ROSize'] : '');
        $pieces = array_filter([$m, $f, $t, $st, $size]);
        return implode(' • ', $pieces) ?: 'Custom Window';
    }

    /** Create/reuse product for SKU, set price */
    public static function ensure_product($sku, $name, $price, array $selections) {
        if (!class_exists('WooCommerce')) return 0;

        $id = wc_get_product_id_by_sku($sku);
        if ($id) {
            $p = wc_get_product($id);
            if ($p && $price > 0) { $p->set_regular_price($price); $p->save(); }
            return $id;
        }

        $post_id = wp_insert_post([
            'post_type'   => 'product',
            'post_status' => 'publish',
            'post_title'  => $name,
            'post_content'=> '',
        ], true);
        if (is_wp_error($post_id) || !$post_id) return 0;

        update_post_meta($post_id, '_sku', $sku);
        update_post_meta($post_id, '_visibility', 'hidden');
        update_post_meta($post_id, '_virtual', 'yes');
        update_post_meta($post_id, '_manage_stock', 'no');

        $product = wc_get_product($post_id);
        if ($product) {
            $product->set_catalog_visibility('hidden');
            $product->set_virtual(true); // change to false if you need shipping
            if ($price > 0) $product->set_regular_price($price);
            $product->save();
        }

        update_post_meta($post_id, '_tws_spec', self::canon_spec($selections));
        update_post_meta($post_id, '_tws_meta', $selections);

        return $post_id;
    }

    /** Hook: ensure line items use our computed price */
    public function apply_custom_price($cart) {
        if (is_admin() && !defined('DOING_AJAX')) return;
        if (did_action('woocommerce_before_calculate_totals') >= 2) return;

        foreach ($cart->get_cart() as $item) {
            if (isset($item['tws_builder_price']) && $item['tws_builder_price'] > 0) {
                $item['data']->set_price($item['tws_builder_price']);
            }
        }
    }

    /** Hook: display selected options on cart/checkout */
    public function display_item_meta($item_data, $cart_item) {
        if (!empty($cart_item['tws_builder_meta']) && is_array($cart_item['tws_builder_meta'])) {
            foreach ($cart_item['tws_builder_meta'] as $label => $value) {
                if ($value === '' || $value === null) continue;
                $item_data[] = [
                    'key'   => wc_clean($label),
                    'value' => is_array($value) ? wc_clean(implode(', ', $value)) : wc_clean($value),
                ];
            }
        }
        return $item_data;
    }
}
