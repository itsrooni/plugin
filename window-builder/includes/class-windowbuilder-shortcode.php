<?php
namespace TWS\WBE;

if (!defined('ABSPATH')) exit;

class Shortcode {
    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) self::$instance = new self();
        return self::$instance;
    }

    private function __construct() {
        add_shortcode('window_builder', [$this, 'render']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    private function page_has_shortcode() {
        if (!is_singular()) return false;
        global $post;
        return $post && stripos($post->post_content ?? '', '[window_builder]') !== false;
    }

    public function enqueue_assets() {
        if (!$this->page_has_shortcode()) return;

        // Styles (reference site styles you copied)
        wp_enqueue_style('tws-main',    TWS_WBE_URL.'assets/css/main.css', [], TWS_WBE_VER);
        wp_enqueue_style('tws-style',   TWS_WBE_URL.'assets/css/style.css', [], TWS_WBE_VER);
        wp_enqueue_style('tws-animate', TWS_WBE_URL.'assets/css/animate.min.css', [], TWS_WBE_VER);

        // Selectric (local)
        wp_enqueue_style('tws-selectric', TWS_WBE_URL.'assets/selectric.css', [], '1.13.0');
        wp_enqueue_script('tws-selectric', TWS_WBE_URL.'assets/jquery.selectric.min.js', ['jquery'], '1.13.0', true);

        // Legacy qlib stack (order-sensitive; you copied these)
        $qlibs = ['control','wndctrl','boxctrl','messagebox','label','button','buttonres','boxres'];
        foreach ($qlibs as $q) {
            $handle = "tws-qlib-$q";
            wp_enqueue_script($handle, TWS_WBE_URL."assets/javascript/qlib/$q.js", ['jquery'], TWS_WBE_VER, true);
        }

        // Optional originals if you included them
        if (file_exists(TWS_WBE_DIR.'assets/javascript/storesupport.js')) {
            wp_enqueue_script('tws-storesupport', TWS_WBE_URL.'assets/javascript/storesupport.js', ['jquery'], TWS_WBE_VER, true);
        }
        if (file_exists(TWS_WBE_DIR.'assets/javascript/windowbuilder.js')) {
            wp_enqueue_script('tws-windowbuilder-core', TWS_WBE_URL.'assets/javascript/windowbuilder.js', ['jquery'], TWS_WBE_VER, true);
        }
        if (file_exists(TWS_WBE_DIR.'assets/javascript/popup.js')) {
            wp_enqueue_script('tws-popup', TWS_WBE_URL.'assets/javascript/popup.js', ['jquery'], TWS_WBE_VER, true);
        }

        // Our glue JS (handles proxy calc + add-to-cart + init)
        wp_enqueue_script('tws-builder', TWS_WBE_URL.'assets/builder.js', ['jquery','tws-selectric'], TWS_WBE_VER, true);

        wp_localize_script('tws-builder', 'TWS_BUILDER', [
            'ajax_url'    => admin_url('admin-ajax.php'),
            'nonce'       => wp_create_nonce('tws_builder'),
            'assets_base' => TWS_WBE_URL.'assets/',
            'origin_calc' => TWS_ORIGIN_CALC_URL,
        ]);
    }

    public function render($atts = [], $content = null) {
        ob_start(); ?>
        <div id="tws-window-builder" class="tws-builder-wrap">
          <form id="windowbuilder" name="windowbuilder" action="#" method="post" onsubmit="return false;">
            <div class="tws-html">
              <?php
              $form_path = TWS_WBE_DIR.'assets/form.html';
              if (file_exists($form_path)) {
                  // Rebase “Images/…” to plugin assets
                  $html = file_get_contents($form_path);
                  $html = str_replace('src="Images/', 'src="'.esc_url(TWS_WBE_URL).'assets/Images/', $html);
                  echo $html;
              } else {
                  echo '<p><em>Place your full form at <code>/assets/form.html</code></em></p>';
              }
              ?>
            </div>
            <div class="tws-actions" style="margin-top:16px; gap:8px;">
              <button type="button" class="default-btn blue small" id="tws-calc">Calculate Total</button>
              <button type="button" class="default-btn blue small" id="tws-add-to-cart">Add to Cart</button>
              <span class="tws-status" aria-live="polite" style="margin-left:8px;"></span>
            </div>
          </form>
        </div>
        <?php
        return ob_get_clean();
    }
}
