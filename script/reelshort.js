/*
 * ReelShort VIP Bypass
 * Author: Hasukatsu
 * 
 * Dựa trên reverse engineering binary ReelShort 3.7.10
 * Endpoints: v-api.crazymaplestudios.com
 * 
 * Features:
 *   ✅ Unlimited Coins & Bonus
 *   ✅ VIP Status (Lifetime)
 *   ✅ All Chapters Unlocked (free)
 *   ✅ HD Unlocked
 *   ✅ Ad-Free
 *   ✅ Auto-Unlock enabled
 */

let body = $response.body;
try {
    let obj = JSON.parse(body);
    let url = $request.url;

    // === Helper: Unlock item (chapter/episode) ===
    function unlockItem(item) {
        if (!item || typeof item !== "object") return;

        // Lock fields → unlock
        let lockFields = ["is_lock", "isLock", "lock", "locked", "is_locked",
                          "need_pay", "needPay", "need_unlock", "is_hold_back",
                          "need_ad", "needAd", "ad_required"];
        lockFields.forEach(k => {
            if (item[k] !== undefined) {
                item[k] = (typeof item[k] === "boolean") ? false : 0;
            }
        });

        // Free fields → true
        let freeFields = ["is_free", "isFree", "free", "unlock", "unlocked",
                          "is_unlocked", "is_paid", "isPaid", "paid",
                          "can_play", "canPlay", "can_watch", "canWatch",
                          "ad_free", "adFree", "is_ad_free",
                          "hd_available", "hd_unlocked", "hd_enabled"];
        freeFields.forEach(k => {
            if (item[k] !== undefined) {
                item[k] = (typeof item[k] === "boolean") ? true : 1;
            }
        });

        // Price fields → 0
        let priceFields = ["price", "coin_price", "coinPrice", "episode_price",
                           "unlock_price", "unlockPrice", "cost", "need_coins"];
        priceFields.forEach(k => {
            if (item[k] !== undefined && typeof item[k] === "number") {
                item[k] = 0;
            }
        });

        // video_type: charge/paid/vip → free
        if (item.video_type === "charge" || item.video_type === "paid" || item.video_type === "vip") {
            item.video_type = "free";
        }
        if (typeof item.video_type === "number" && item.video_type > 1) {
            item.video_type = 1;
        }

        // pay_mode → free
        if (item.pay_mode !== undefined) {
            item.pay_mode = (typeof item.pay_mode === "string") ? "free" : 0;
        }

        // pay_index → very high (all chapters free)
        if (item.pay_index !== undefined && typeof item.pay_index === "number") {
            item.pay_index = 99999;
        }
    }

    // === Helper: Recursive deep unlock ===
    function deepUnlock(obj) {
        if (Array.isArray(obj)) {
            obj.forEach(deepUnlock);
        } else if (obj && typeof obj === "object") {
            unlockItem(obj);
            for (let key in obj) {
                if (obj[key] && typeof obj[key] === "object") {
                    deepUnlock(obj[key]);
                }
            }
        }
    }

    // === Helper: Patch account object ===
    function patchAccount(acc) {
        if (!acc || typeof acc !== "object") return;
        let mapping = {
            "coins": 999999,
            "bonus": 999999,
            "ads_free_sec": 4102444800,
            "coin_bag_sec": 4102444800,
            "coin_bag_pri": 999999,
            "vip_expire": 4102444800,
            "vip_sec": 4102444800,
            "vip_status": 1,
            "vip_category": 3,
            "vip_type": 3,
            "sub_status": 1,
            "sub_type": 3,
            "total_option_cards": 999,
            "vip_points": 99999,
            "subscribe_coin_bag_sec": 4102444800,
        };
        for (let k in mapping) {
            if (acc[k] !== undefined) {
                acc[k] = mapping[k];
            }
        }
    }

    // ==========================================
    // ROUTE: Based on URL endpoint
    // ==========================================

    if (url.includes("earn-reward/list") || url.includes("earn-reward/taskDetail")) {
        // Earn reward pages contain account object
        if (obj.data && obj.data.account) {
            patchAccount(obj.data.account);
        }
    }
    else if (url.includes("getMyVip") || url.includes("getVipGoods") || url.includes("getStoreList") ||
             url.includes("getVipPopupInfo") || url.includes("vipUpgradeList")) {
        // VIP / Store endpoints
        if (obj.data) {
            let vipFields = {
                "is_vip": true, "isVip": true, "vip_status": 1,
                "vip_type": 3, "vip_category": 3,
                "expire_time": 4102444800, "vip_expire": 4102444800,
                "vip_expire_time": 4102444800,
                "sub_status": 1
            };
            for (let k in vipFields) {
                if (obj.data[k] !== undefined) obj.data[k] = vipFields[k];
            }
            if (obj.data.vip_info) {
                for (let k in vipFields) {
                    if (obj.data.vip_info[k] !== undefined) obj.data.vip_info[k] = vipFields[k];
                }
            }
            patchAccount(obj.data);
        }
    }
    else if (url.includes("getUserInfo")) {
        // User info
        if (obj.data) {
            if (obj.data.vip_status !== undefined) obj.data.vip_status = 1;
            if (obj.data.vip_type !== undefined) obj.data.vip_type = 3;
            if (obj.data.vip_expire !== undefined) obj.data.vip_expire = 4102444800;
            if (obj.data.is_vip !== undefined) obj.data.is_vip = true;
            if (obj.data.coins !== undefined) obj.data.coins = 999999;
            if (obj.data.bonus !== undefined) obj.data.bonus = 999999;
        }
    }
    else if (url.includes("getBookDetail") || url.includes("getChapterList") ||
             url.includes("getChapterContent") || url.includes("simpleInfo") ||
             url.includes("getUserHistoryAndList") || url.includes("myHistory") ||
             url.includes("myList")) {
        // Book/Chapter endpoints — unlock all
        deepUnlock(obj);
    }
    else if (url.includes("getPayMode")) {
        // Pay mode → free
        if (obj.data) {
            if (obj.data.pay_mode !== undefined) obj.data.pay_mode = (typeof obj.data.pay_mode === "string") ? "free" : 0;
            if (obj.data.coin_price !== undefined) obj.data.coin_price = 0;
            if (obj.data.need_ad !== undefined) obj.data.need_ad = false;
        }
        deepUnlock(obj);
    }
    else if (url.includes("startPlay") || url.includes("startRead")) {
        // Start play — ensure unlocked
        if (obj.data) {
            if (obj.data.is_lock !== undefined) obj.data.is_lock = 0;
            if (obj.data.need_pay !== undefined) obj.data.need_pay = 0;
        }
        deepUnlock(obj);
    }
    else if (url.includes("requestAdvUnlock") || url.includes("setAutoUnLock") ||
             url.includes("exchange")) {
        // Force unlock success
        obj.code = 0;
        obj.msg = "success";
        if (!obj.data) obj.data = {};
        obj.data.success = true;
        obj.data.unlocked = true;
    }
    else if (url.includes("coin-bag")) {
        // Coin bag
        if (obj.data) {
            if (obj.data.coins !== undefined) obj.data.coins = 999999;
            if (obj.data.bonus !== undefined) obj.data.bonus = 999999;
        }
    }
    else if (url.includes("hdExperience") || url.includes("hdVipPopUp")) {
        // HD
        deepUnlock(obj);
    }
    else if (url.includes("check_in_goods") || url.includes("redPoint")) {
        // Minor endpoints, patch account if present
        if (obj.data && obj.data.account) {
            patchAccount(obj.data.account);
        }
    }
    else {
        // Catch-all: deep unlock everything
        deepUnlock(obj);
    }

    // Always patch account if found anywhere
    if (obj.data && obj.data.account) {
        patchAccount(obj.data.account);
    }

    body = JSON.stringify(obj);
} catch (e) {}

$done({"body": body});
