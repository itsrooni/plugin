<?php
namespace TWS\WBE;

if (!defined('ABSPATH')) exit;

class Ajax {
    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_action('wp_ajax_tws_calc', [$this, 'calc']);
        add_action('wp_ajax_nopriv_tws_calc', [$this, 'calc']);

        add_action('wp_ajax_tws_add_to_cart', [$this, 'add_to_cart']);
        add_action('wp_ajax_nopriv_tws_add_to_cart', [$this, 'add_to_cart']);
    }

    /** POST to origin ASP.NET page and parse prices */
    public function calc() {
        check_ajax_referer('tws_builder', 'nonce');

        $fields = $_POST['fields'] ?? [];
        if (!is_array($fields) || empty($fields)) {
            wp_send_json_error(['message' => 'No fields.']);
        }
        $fields['FormSubmitted'] = $fields['FormSubmitted'] ?? 'yep';

        $resp = wp_remote_post(TWS_ORIGIN_CALC_URL, [
            'timeout' => 20,
            'headers' => [
                'Content-Type' => 'application/x-www-form-urlencoded',
                'User-Agent'   => 'WP-Window-Builder-Proxy'
            ],
            'body'    => $fields
        ]);
        if (is_wp_error($resp)) {
            wp_send_json_error(['message' => 'Origin error: '.$resp->get_error_message()]);
        }
        $html = wp_remote_retrieve_body($resp);
        if (!$html) {
            wp_send_json_error(['message' => 'Empty response from origin.']);
        }

        // Grab price spans (both top and bottom blocks if present)
        $list   = Helper::extract_span($html, 'DisplayListPrice1');
        $unit   = Helper::extract_span($html, 'DisplayPrice1');
        $total  = Helper::extract_span($html, 'DisplayPriceTotal1');
        $unit2  = Helper::extract_span($html, 'DisplayPrice2');
        $total2 = Helper::extract_span($html, 'DisplayPriceTotal2');

        $unitF  = Helper::parse_money($unit ?: $unit2);
        $totalF = Helper::parse_money($total ?: $total2);
        $listF  = Helper::parse_money($list);

        wp_send_json_success([
            'prices' => [
                'list'  => $listF,
                'unit'  => $unitF,
                'total' => $totalF,
            ],
        ]);
    }

    /** Auto-create/reuse product for spec and add to cart */
    public function add_to_cart() {
        check_ajax_referer('tws_builder', 'nonce');

        if (!class_exists('WooCommerce')) {
            wp_send_json_error(['message' => 'WooCommerce not active.']);
        }

        $qty         = max(1, intval($_POST['quantity'] ?? 1));
        $price       = (float)($_POST['computed_price'] ?? 0);
        $selections  = (isset($_POST['selections']) && is_array($_POST['selections'])) ? $_POST['selections'] : [];

        $spec = Helper::canon_spec($selections);
        $sku  = 'WIN-' . substr(hash('sha256', $spec), 0, 16);
        $name = Helper::product_name($selections);

        $product_id = Helper::ensure_product($sku, $name, $price, $selections);
        if (!$product_id) {
            wp_send_json_error(['message' => 'Could not prepare product.']);
        }

        $cart_item_data = [
            'tws_builder_meta'  => $selections,
            'tws_builder_price' => $price,
        ];
        $key = \WC()->cart->add_to_cart($product_id, $qty, 0, [], $cart_item_data);
        if (!$key) {
            wp_send_json_error(['message' => 'Could not add to cart.']);
        }

        wp_send_json_success([
            'message'    => 'Added to cart.',
            'cart_url'   => wc_get_cart_url(),
            'product_id' => $product_id,
            'sku'        => $sku
        ]);
    }
}
