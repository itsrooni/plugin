<?php
/**
 * Plugin Name: Window Builder Embed (Shortcode + WooCommerce)
 * Description: Embeds the Window Builder via [window_builder], proxies price calculation to ASP.NET, auto-creates/reuses products per spec, and adds to Woo.
 * Version: 1.2.0
 * Author: Haroon
 */

if (!defined('ABSPATH')) exit;

define('TWS_WBE_VER', '1.3.0');
define('TWS_WBE_DIR', plugin_dir_path(__FILE__));
define('TWS_WBE_URL', plugin_dir_url(__FILE__));
define('TWS_ORIGIN_CALC_URL', 'https://app.thewindowstore.com/MyEstimatesWindowBuilder.aspx');

// Load classes
require_once TWS_WBE_DIR . 'includes/class-windowbuilder-helper.php';
require_once TWS_WBE_DIR . 'includes/class-windowbuilder-ajax.php';
require_once TWS_WBE_DIR . 'includes/class-windowbuilder-shortcode.php';

// Bootstrap
add_action('plugins_loaded', function () {
    // Instantiate singletons
    \TWS\WBE\Helper::instance();
    \TWS\WBE\Ajax::instance();
    \TWS\WBE\Shortcode::instance();
});

class TWS_Window_Builder_Embed {
    public function __construct() {
        add_shortcode('window_builder', [$this, 'render_shortcode']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);

        // Price calculation proxy (AJAX)
        add_action('wp_ajax_tws_calc', [$this, 'ajax_calc']);
        add_action('wp_ajax_nopriv_tws_calc', [$this, 'ajax_calc']);

        // Add to cart (auto-create/reuse product)
        add_action('wp_ajax_tws_add_to_cart', [$this, 'ajax_add_to_cart']);
        add_action('wp_ajax_nopriv_tws_add_to_cart', [$this, 'ajax_add_to_cart']);

        // Apply computed price to line item
        add_action('woocommerce_before_calculate_totals', [$this, 'apply_custom_price'], 20);

        // Show selections on cart/checkout
        add_filter('woocommerce_get_item_data', [$this, 'display_item_meta'], 10, 2);
    }

    private function page_has_shortcode() {
        if (!is_singular()) return false;
        global $post;
        return $post && stripos($post->post_content ?? '', '[window_builder]') !== false;
    }

    public function enqueue_assets() {
        if (!$this->page_has_shortcode()) return;

        $base = plugin_dir_url(__FILE__);
        $ver  = '1.2.0';

        // Your page CSS (local copies)
        wp_enqueue_style('tws-main',   $base.'assets/css/main.css', [], $ver);
        wp_enqueue_style('tws-style',  $base.'assets/css/style.css', [], $ver);
        wp_enqueue_style('tws-animate',$base.'assets/css/animate.min.css', [], $ver);
        wp_enqueue_style('tws-builder',$base.'assets/builder.css', [], $ver);

        // Legacy qlib stack (order-sensitive)
        foreach (['control','wndctrl','boxctrl','messagebox','label','button','buttonres','boxres'] as $q) {
            wp_enqueue_script("tws-qlib-$q", $base."assets/javascript/qlib/$q.js", ['jquery'], $ver, true);
        }

        // Optional originals if you have them
        if (file_exists(__DIR__.'/assets/javascript/storesupport.js')) {
            wp_enqueue_script('tws-storesupport', $base.'assets/javascript/storesupport.js', ['jquery'], $ver, true);
        }
        if (file_exists(__DIR__.'/assets/javascript/windowbuilder.js')) {
            wp_enqueue_script('tws-windowbuilder-core', $base.'assets/javascript/windowbuilder.js', ['jquery'], $ver, true);
        }

        // Our glue JS
        wp_enqueue_script('tws-builder', $base.'assets/builder.js', ['jquery'], $ver, true);

        wp_localize_script('tws-builder', 'TWS_BUILDER', [
            'ajax_url'     => admin_url('admin-ajax.php'),
            'nonce'        => wp_create_nonce('tws_builder'),
            'assets_base'  => $base.'assets/',
            'pricing_url'  => file_exists(__DIR__.'/assets/pricing.json') ? $base.'assets/pricing.json' : $base.'assets/pricing.example.json',
            'origin_calc'  => TWS_ORIGIN_CALC_URL
        ]);

        // Load Selectric only if not on the page already
        wp_add_inline_script('tws-builder', '(function($){if(!$.fn.selectric){var l=document.createElement("link");l.rel="stylesheet";l.href="'.$base.'assets/selectric.css";document.head.appendChild(l);var s=document.createElement("script");s.src="'.$base.'assets/jquery.selectric.min.js";s.defer=true;document.body.appendChild(s);}})(jQuery);');
    }

    public function render_shortcode($atts = [], $content = null) {
        ob_start(); ?>
        <div id="tws-window-builder" class="tws-builder-wrap">
          <form id="windowbuilder" name="windowbuilder" action="#" method="post" onsubmit="return false;">
            <div class="tws-html">
              <?php
              $form_path = __DIR__.'/assets/form.html';
              if (file_exists($form_path)) {
                  echo file_get_contents($form_path);
              } else {
                  echo '<p><em>Place your form in /assets/form.html</em></p>';
              }
              ?>
            </div>
            <div class="tws-actions">
              <button type="button" class="default-btn blue small" id="tws-calc">Calculate Total</button>
              <button type="button" class="default-btn blue small" id="tws-add-to-cart">Add to Cart</button>
              <span class="tws-status" aria-live="polite"></span>
            </div>
          </form>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Server-to-server price calculation proxy.
     * Posts form data to the ASP.NET page and parses the returned HTML for price spans.
     */
    public function ajax_calc() {
        check_ajax_referer('tws_builder', 'nonce');

        $fields = $_POST['fields'] ?? [];
        if (!is_array($fields) || empty($fields)) {
            wp_send_json_error(['message' => 'No fields.']);
        }

        // Ensure required hidden fields exist like real page
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

        // Parse minimal values
        $prices = [
            'list'   => $this->extract_span($html, 'DisplayListPrice1'),
            'unit'   => $this->extract_span($html, 'DisplayPrice1'),        // Our Price
            'total'  => $this->extract_span($html, 'DisplayPriceTotal1'),
            'unit2'  => $this->extract_span($html, 'DisplayPrice2'),
            'total2' => $this->extract_span($html, 'DisplayPriceTotal2'),
        ];

        // Pick the best we have
        $unit  = $this->first_money([$prices['unit'], $prices['unit2']]);
        $total = $this->first_money([$prices['total'], $prices['total2']]);

        wp_send_json_success([
            'prices' => [
                'list'  => $this->first_money([$prices['list']]),
                'unit'  => $unit,
                'total' => $total,
            ],
            // Optional: return raw HTML if you need more fields in future
            // 'html' => $html
        ]);
    }

    private function extract_span($html, $id) {
        if (preg_match('#<span[^>]*id=["\']'.preg_quote($id, '#').'["\'][^>]*>(.*?)</span>#is', $html, $m)) {
            return trim(wp_strip_all_tags($m[1]));
        }
        return '';
    }

    private function first_money($arr) {
        foreach ($arr as $v) {
            if (!$v) continue;
            $n = preg_replace('/[^0-9\.\-]/', '', $v);
            if ($n !== '' && is_numeric($n)) return (float)$n;
        }
        return 0;
    }

    /**
     * Add to cart:
     * - Build a normalized spec
     * - Hash to SKU
     * - Create/reuse a hidden simple product with that SKU
     * - Set computed price on the product and the line item
     */
    public function ajax_add_to_cart() {
        check_ajax_referer('tws_builder', 'nonce');

        if (!class_exists('WooCommerce')) {
            wp_send_json_error(['message' => 'WooCommerce not active.']);
        }

        $qty       = max(1, intval($_POST['quantity'] ?? 1));
        $price     = floatval($_POST['computed_price'] ?? 0);
        $selections= (isset($_POST['selections']) && is_array($_POST['selections'])) ? $_POST['selections'] : [];

        // Build a canonical spec string for SKU and title
        $spec = $this->canon_spec($selections);
        $sku  = 'WIN-' . substr(hash('sha256', $spec), 0, 16);

        // Ensure product exists
        $product_id = $this->ensure_product($sku, $spec, $price, $selections);

        if (!$product_id) {
            wp_send_json_error(['message' => 'Could not prepare product.']);
        }

        // Add to cart with meta (we still set line item price in totals hook too)
        $cart_item_data = [
            'tws_builder_meta'  => $selections,
            'tws_builder_price' => $price,
        ];
        $key = WC()->cart->add_to_cart($product_id, $qty, 0, [], $cart_item_data);
        if (!$key) {
            wp_send_json_error(['message' => 'Could not add to cart.']);
        }

        wp_send_json_success([
            'message'  => 'Added to cart.',
            'cart_url' => wc_get_cart_url(),
            'product_id' => $product_id,
            'sku' => $sku
        ]);
    }

    private function canon_spec($s) {
        // Define the order that makes sense to you
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

    private function ensure_product($sku, $spec, $price, $selections) {
        // Reuse if exists
        $id = wc_get_product_id_by_sku($sku);
        if ($id) {
            // Optionally update price to latest calc
            $p = wc_get_product($id);
            if ($p && $price > 0) { $p->set_regular_price($price); $p->save(); }
            return $id;
        }

        // Create a hidden simple product
        $name = $this->generate_product_name($selections);
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
        update_post_meta($post_id, '_sold_individually', 'no');
        update_post_meta($post_id, '_manage_stock', 'no');

        $product = wc_get_product($post_id);
        if ($product) {
            $product->set_catalog_visibility('hidden');
            $product->set_virtual(true);
            if ($price > 0) $product->set_regular_price($price);
            $product->save();
        }

        // Optional: store raw spec for later reference
        update_post_meta($post_id, '_tws_spec', $spec);
        update_post_meta($post_id, '_tws_meta', $selections);

        return $post_id;
    }

    private function generate_product_name($s) {
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

    public function apply_custom_price($cart) {
        if (is_admin() && !defined('DOING_AJAX')) return;
        if (did_action('woocommerce_before_calculate_totals') >= 2) return;

        foreach ($cart->get_cart() as $item) {
            if (isset($item['tws_builder_price']) && $item['tws_builder_price'] > 0) {
                $item['data']->set_price($item['tws_builder_price']);
            }
        }
    }

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
new TWS_Window_Builder_Embed();
