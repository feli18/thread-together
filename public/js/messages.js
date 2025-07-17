// JavaScript for Messages Page Tabs

document.addEventListener('DOMContentLoaded', () => {
    const tabLinks = document.querySelectorAll('#messageTabs .nav-link');
    const tabPanes = document.querySelectorAll('.tab-pane');
  
    tabLinks.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
  
        // Remove active class from all links
        tabLinks.forEach(l => l.classList.remove('active'));
        // Add active to clicked link
        this.classList.add('active');
  
        // Hide all tab panes
        tabPanes.forEach(pane => pane.classList.add('d-none'));
        // Show selected tab pane
        const target = document.getElementById(this.dataset.tab);
        target.classList.remove('d-none');
      });
    });
  });
  