// popup.js (MV3-safe: no inline code)

(function(){
  // عناصر
  const $ = (id) => document.getElementById(id);
  const reservation = $("reservation");
  const msg = $("msg");

  // تحويل التخزين لوعود
  const storageSet = (obj) => new Promise((res, rej) => {
    chrome.storage.sync.set(obj, () => chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res());
  });
  const storageGet = (keys) => new Promise((res, rej) => {
    chrome.storage.sync.get(keys, (out) => chrome.runtime.lastError ? rej(chrome.runtime.lastError) : res(out));
  });

  const showMessage = (t, ok=true) => {
    if(!msg) return;
    msg.textContent = t;
    msg.style.color = ok ? "#9be19b" : "#ff6b6b";
  };

  // تحقق من الوقت HH:MM:SS
  const validTime = (str) => /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test((str||"").trim());

  // events
  if (reservation) {
    reservation.addEventListener("input", () => {
      reservation.value = reservation.value.replace(/\D+/g, "");
    });
  }

  // تحميل القيم عند فتح الـ popup
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const { bookingForm, targetTime } = await storageGet(["bookingForm","targetTime"]);
      if (bookingForm) {
        $("reservation").value = bookingForm.reservation || "";
        $("firstName").value = bookingForm.firstName || "";
        $("lastName").value  = bookingForm.lastName  || "";
        $("email").value     = bookingForm.email     || "";
        $("passport").value  = bookingForm.passport  || "";
        $("phone").value     = bookingForm.phone     || "";
      }
      if (targetTime) $("targetTime").value = targetTime;
    } catch (e) {
      console.error("storage get error:", e);
      try {
        const local = localStorage.getItem("bookingForm");
        const tt = localStorage.getItem("targetTime");
        if (local) {
          const d = JSON.parse(local);
          $("reservation").value = d.reservation || "";
          $("firstName").value = d.firstName || "";
          $("lastName").value  = d.lastName  || "";
          $("email").value     = d.email     || "";
          $("passport").value  = d.passport  || "";
          $("phone").value     = d.phone     || "";
        }
        if (tt) $("targetTime").value = tt;
      } catch(_) {}
    }
  });

  // حفظ القيم
  $("saveBtn")?.addEventListener("click", async () => {
    const data = {
      reservation: $("reservation").value.trim(),
      firstName: $("firstName").value.trim(),
      lastName: $("lastName").value.trim(),
      email: $("email").value.trim(),
      passport: $("passport").value.trim(),
      phone: $("phone").value.trim(),
    };
    let targetTimeVal = ($("targetTime").value || "").trim() || "01:12:00";

    if(!validTime(targetTimeVal)) return showMessage("ادخل وقت بصيغة صحيحة مثل 01:12:00", false);
    if(!data.reservation) return showMessage("املأ رقم الحجز", false);
    if(!data.firstName || !data.lastName) return showMessage("املأ الاسم والكنية", false);

    try{
      await storageSet({ bookingForm: data, targetTime: targetTimeVal });
      showMessage("تم الحفظ بنجاح");
    }catch(e){
      console.error("storage set error:", e);
      localStorage.setItem("bookingForm", JSON.stringify(data));
      localStorage.setItem("targetTime", targetTimeVal);
      showMessage("تم الحفظ محليًا (storage.sync غير متاح)");
    }
  });
})();
