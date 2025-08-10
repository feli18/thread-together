document.addEventListener('DOMContentLoaded', () => {
    const tabLinks = document.querySelectorAll('#messageTabs .nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
  
    tabLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
  
        tabLinks.forEach(l => l.classList.remove('active'));
        this.classList.add('active');
  
        tabPanes.forEach(pane => pane.classList.add('d-none'));

        const target = document.getElementById(this.dataset.tab);
        target.classList.remove('d-none');
      });
    });
  });
  