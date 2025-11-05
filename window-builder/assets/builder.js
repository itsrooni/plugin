(function($){
  // … keep the rest of builder.js as I gave before …

  function serializeForm(){
    // serialize() returns query string; convert to object
    var arr = $('#windowbuilder').serializeArray(), obj = {};
    arr.forEach(function(x){
      if (obj[x.name] !== undefined) {
        if (!Array.isArray(obj[x.name])) obj[x.name] = [obj[x.name]];
        obj[x.name].push(x.value);
      } else {
        obj[x.name] = x.value;
      }
    });
    // Required hidden like the origin does
    obj['FormSubmitted'] = obj['FormSubmitted'] || 'yep';
    return obj;
  }

  function showPrices(p){
    if (!p) return;
    if (p.list != null && p.list > 0) $('#DisplayListPrice1').text('$' + p.list.toFixed(2));
    if (p.unit != null && p.unit > 0) { $('#DisplayPrice1,#DisplayPrice2').text('$' + p.unit.toFixed(2)); }
    if (p.total != null && p.total > 0) { $('#DisplayPriceTotal1,#DisplayPriceTotal2').text('$' + p.total.toFixed(2)); }
  }

  function calcViaProxy(){
    var $s = $('.tws-status'); $s.text('Calculating…');
    return $.ajax({
      url: TWS_BUILDER.ajax_url,
      method: 'POST',
      data: {
        action: 'tws_calc',
        nonce: TWS_BUILDER.nonce,
        fields: serializeForm()
      }
    }).then(function(res){
      if (res && res.success && res.data && res.data.prices){
        showPrices(res.data.prices);
        $s.text('');
        return res.data.prices;
      } else {
        $s.text('Could not calculate price.');
        return null;
      }
    }).fail(function(){ $('.tws-status').text('Origin error.'); return null; });
  }

  // Button: Calculate Total (server-to-server)
  $('#tws-calc').on('click', function(){
    calcViaProxy();
  });

  // OPTIONAL: auto-calc on each change (comment out if too chatty)
  // $(document).on('change', '#windowbuilder input, #windowbuilder select', calcViaProxy);

  // Add to cart (unchanged; still uses currentComputedPrice())
  $('#tws-add-to-cart').off('click').on('click', function(){
    var $btn = $(this), $status = $('.tws-status');
    $btn.prop('disabled', true); $status.text('Adding…');

    // if you want to *force* latest price from origin before add-to-cart:
    calcViaProxy().always(function(){
      var selections = {};
      $('#windowbuilder').find('input, select, textarea').each(function(){
        var $el = $(this), name = $el.attr('name'); if(!name) return;
        if ($el.is(':radio')) {
          if ($el.is(':checked')) selections[name] = $el.val();
        } else if ($el.is(':checkbox')) {
          if (!selections[name]) selections[name] = [];
          if ($el.is(':checked')) selections[name].push($el.val() || 'Yes');
        } else {
          selections[name] = $el.val();
        }
      });

      $.ajax({
        url: TWS_BUILDER.ajax_url,
        method: 'POST',
        data: {
          action: 'tws_add_to_cart',
          nonce: TWS_BUILDER.nonce,
          quantity: parseInt($('input[name="quantity"]').val() || '1', 10) || 1,
          computed_price: (function(){
            var total = ($('#DisplayPriceTotal1').text() || $('#DisplayPriceTotal2').text()).replace(/[^0-9.\-]/g,'');
            var unit  = ($('#DisplayPrice1').text() || $('#DisplayPrice2').text()).replace(/[^0-9.\-]/g,'');
            var q = parseInt($('input[name="quantity"]').val()||'1',10)||1;
            if (total) return parseFloat(total);
            if (unit) return parseFloat(unit)*q;
            return 0;
          })(),
          selections: selections
        }
      }).done(function(res){
        if(res && res.success){
          $status.html('Added! <a href="'+res.data.cart_url+'">View cart</a>.');
        } else {
          $status.text((res && res.data && res.data.message) ? res.data.message : 'Could not add to cart.');
        }
      }).fail(function(){ $status.text('Network error.'); })
        .always(function(){ $btn.prop('disabled', false); });
    });
  });

  // keep other helpers (image path rewrite, Selectric init, etc.) from previous file
})(jQuery);
