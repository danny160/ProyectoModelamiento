function updateCount(id, delta) {
  const span = document.getElementById(id);
  let value = parseInt(span.textContent);
  const min = 0;
  value = Math.max(min, value + delta);
  span.textContent = value;
}

function toggleCounter(switchId, counterId) {
  var sw = document.getElementById(switchId);
  var box = document.getElementById(counterId);
  box.style.display = sw.checked ? "flex" : "none";
}

document.addEventListener("DOMContentLoaded", function() {
  ['chkProyectores','chkPortatiles','chkComputadores','chkPantallas','chkRouter','chkLuces'].forEach(function(id){
    var sw = document.getElementById(id);
    var bx = document.getElementById('ctr'+id.replace('chk',''));
    if(sw && bx) bx.style.display = sw.checked ? "flex" : "none";
    if(sw) sw.addEventListener('change', function(){
      toggleCounter(id, 'ctr'+id.replace('chk',''));
    });
  });
});
