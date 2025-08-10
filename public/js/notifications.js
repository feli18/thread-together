document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll('#notificationTabs .nav-link');
  const panes = document.querySelectorAll('.tab-pane');

  const removeTabBadge = (type) => {
    const selector = type === 'comments' ? '[href="#comments-tab"] .badge' : '[href="#likes-tab"] .badge';
    const badge = document.querySelector(selector);
    if (badge) badge.remove();
  };

  const updateSidebarBadge = (count) => {
    const sidebarLink = document.querySelector('a[href="/notifications"]');
    let badge = sidebarLink.querySelector('.badge');
    if (count > 0) {
      if (badge) {
        badge.textContent = count;
      } else {
        badge = document.createElement("span");
        badge.className = "badge bg-danger rounded-circle";
        badge.textContent = count;
        sidebarLink.appendChild(badge);
      }
    } else {
      if (badge) badge.remove();
    }
  };

  const markAsRead = (type) => {
    fetch("/notifications/mark-read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type })
    })
      .then(res => res.json())
      .then(data => {
        removeTabBadge(type);
        updateSidebarBadge(data.totalUnread);
      })
      .catch(console.error);
  };


  setTimeout(() => {
    const defaultTab = document.querySelector('#notificationTabs .nav-link.active');
    if (defaultTab) {
      const type = defaultTab.getAttribute('href') === '#comments-tab' ? 'comments' : 'likes';
      markAsRead(type);
    }
  }, 300);


  tabs.forEach(tab => {
    tab.addEventListener('click', e => {
      e.preventDefault();
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('show', 'active'));
      tab.classList.add('active');
      document.querySelector(tab.getAttribute('href')).classList.add('show', 'active');

      const type = tab.getAttribute('href') === '#comments-tab' ? 'comments' : 'likes';
      markAsRead(type);
    });
  });
});
