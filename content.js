// ==UserScript==
// @name         Family reunion
// @namespace    http://tampermonkey.net/
// @version      2025-02-15
// @description  try to take over the world!
// @author       You
// @match        https://service2.diplo.de/rktermin/extern*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    localStorage.setItem(window.location.pathname,window.location.href)

    console.log(window.location.pathname)
    console.log("zain1")

    if(window.location.pathname === "/rktermin/extern/choose_categoryList.do" || window.location.pathname === "/rktermin/extern/choose_category.do")
    {
        let linkc = Array.from(document.querySelectorAll("a")).find(a => a.textContent.trim() === "Continue");
        console.log(linkc)
        linkc.click()
    }
    else
    {

        let linkgo = Array.from(document.querySelectorAll("a")).find(a => a.textContent.trim() === "Appointments are available");

        if(linkgo)
        {
            console.log(linkgo)
            linkgo.click()
        }

        // ===== تعديل: استخدم bookingForm.reservation بدل الرقم 6 =====
        (function handleBookingIndex(){
            let bookingIndex = 6; // افتراضي إذا لم يوجد حفظ

            const applyIndex = (idx) => {
                // حوّل للنمبر وتأكد من أنه >= 0
                const n = parseInt(idx, 10);
                if (!Number.isNaN(n) && n >= 0) bookingIndex = n;

                console.log(bookingIndex)

                let linktime = document.querySelectorAll("a[class='arrow']")[bookingIndex]; // رقم الحجز  <<<<<<<<<<<<<<<<<<<<<<<<<<
                if(!linktime)
                {
                    linktime = Array.from(document.querySelectorAll("a")).find(a => a.textContent.trim() === "Book this appointment");
                    if(linktime)
                    {
                        linktime.click()
                    }

                }
                else
                {
                    if(window.location.pathname !== "/rktermin/extern/choose_realmList.do")
                    {

                        linktime.click()
                    }
                }
            };

            try {
                // اقرأ من chrome.storage.sync => bookingForm.reservation
                chrome.storage.sync.get(["bookingForm"], (res) => {
                    let idx = bookingIndex;
                    if (res && res.bookingForm && res.bookingForm.reservation != null) {
                        idx = res.bookingForm.reservation;
                    } else {
                        // احتياط: localStorage
                        const local = localStorage.getItem("bookingForm");
                        if (local) {
                            const f = JSON.parse(local);
                            if (f && f.reservation != null) idx = f.reservation;
                        }
                    }
                    applyIndex(idx);
                });
            } catch(e){
                // في حال عدم توفر chrome.storage (مثلاً بتمبرمونكي)
                const local = localStorage.getItem("bookingForm");
                let idx = bookingIndex;
                if (local) {
                    const f = JSON.parse(local);
                    if (f && f.reservation != null) idx = f.reservation;
                }
                applyIndex(idx);
            }
        })();
        // ===== نهاية التعديل =====

    }

    let input = document.querySelector("input[name='email']");
    if (input && input.type === "hidden") {
        let inp1 = document.querySelector("input[name='captchaText']")
        let btn1 = document.querySelector("input[value='Continue']")
        inp1 && inp1.focus()
        console.log(inp1)

        const targetTimeDefault = "01:12:00";

        // جرّب قراءة targetTime من التخزين (لو كنت حافظه من الـ popup)
        function getTargetTime(cb){
            try {
                chrome.storage.sync.get(["targetTime"], (res) => {
                    cb(res && res.targetTime ? res.targetTime : targetTimeDefault);
                });
            } catch(e){
                const tt = localStorage.getItem("targetTime");
                cb(tt || targetTimeDefault);
            }
        }

        getTargetTime((targetTime) => {
            const timer = setInterval(() => {
                const now = new Date();
                const currentTime = now.toTimeString().split(" ")[0]; // HH:MM:SS
                if (currentTime === targetTime) {
                    console.log("الوقت المحدد تحقق ✅", targetTime);
                    btn1 && btn1.click()
                    clearInterval(timer);
                }
            }, 500);
        });

        console.log("الـ input موجود ونوعه مخفي (hidden)");
    } else if(input && input.type === "text") {

        let inp1 = document.querySelector("input[name='captchaText']")
        let btn1 = document.querySelector("input[value='Submit']")
        inp1 && inp1.focus()

        let lastname = document.querySelector("input[name='lastname']")
        let firstname = document.querySelector("input[name='firstname']")
        let email = document.querySelector("input[name='email']")
        let emailrepeat = document.querySelector("input[name='emailrepeat']")
        let paspor = document.querySelector("input[name='fields[0].content']")
        let phone = document.querySelector("input[name='fields[1].content']")

        // helper: يعيّن القيمة ويطلق أحداث input/change حتى تبين بالقيمة قدامك وتتفعّل أي listeners
        function setVal(el, val){
            if(!el) return;
            el.value = val || "";
            el.dispatchEvent(new Event("input", { bubbles: true }));
            el.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // قراءة القيم من تخزين كروم (قادمة من popup.html)
        function fillFromStorage(){
            try{
                chrome.storage.sync.get(["bookingForm"], (res) => {
                    const f = (res && res.bookingForm) ? res.bookingForm : null;
                    if (f) {
                        setVal(firstname, f.firstName);
                        setVal(lastname, f.lastName);
                        setVal(email, f.email);
                        setVal(emailrepeat, f.email); // نفس الإيميل للإعادة
                        setVal(paspor, f.passport);
                        setVal(phone, f.phone);
                        console.log("تم تعبئة القيم من التخزين:", f);
                    } else {
                        // احتياط: لو ما في قيم محفوظة، خليك على الفاليوز الافتراضية اللي كانت عندك
                        setVal(firstname, "RUBA");
                        setVal(lastname, "BARBESH");
                        setVal(email, "derwolfnuor@gmail.com");
                        setVal(emailrepeat, "derwolfnuor@gmail.com");
                        setVal(paspor, "P00004712");
                        setVal(phone, "004915774885442");
                        console.log("لا توجد قيم محفوظة، تم استخدام القيم الافتراضية.");
                    }
                });
            }catch(e){
                // احتياط عبر localStorage لو متاح
                const local = localStorage.getItem("bookingForm");
                if(local){
                    const f = JSON.parse(local);
                    setVal(firstname, f.firstName);
                    setVal(lastname, f.lastName);
                    setVal(email, f.email);
                    setVal(emailrepeat, f.email);
                    setVal(paspor, f.passport);
                    setVal(phone, f.phone);
                    console.log("تم تعبئة القيم من localStorage:", f);
                }else{
                    setVal(firstname, "RUBA");
                    setVal(lastname, "BARBESH");
                    setVal(email, "derwolfnuor@gmail.com");
                    setVal(emailrepeat, "derwolfnuor@gmail.com");
                    setVal(paspor, "P00004712");
                    setVal(phone, "004915774885442");
                    console.log("fallback للقيم الافتراضية (no storage).");
                }
            }
        }

        fillFromStorage();

        console.log(lastname, firstname, email ,emailrepeat ,paspor ,phone)

        inp1 && inp1.addEventListener("keyup",(e) =>{
            if((e.target.value || "").length == 6)
            {
                btn1 && btn1.click()
            }
        })
        console.log("إما أن الـ input غير موجود أو ليس مخفيًا" , input);
    }

})();
