"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Users,
  UserPlus,
  Settings,
  Phone,
  Video,
  User,
  Image as ImageIcon,
  Smile,
  Mic,
  Camera,
  MessageSquare,
  Building2,
  Landmark,
  Bell,
  BellOff,
  CheckSquare,
  Bookmark,
  QrCode,
  Send,
  ShieldAlert,
  CheckCircle,
  XCircle,
  KeyRound,
  CreditCard,
  Wallet,
  ScanFace,
  RefreshCw,
  UsersRound,
  MoreVertical,
  MapPin,
  Sun,
  Moon,
  Megaphone,
  Plus
} from 'lucide-react';

import { useNavigate } from '@/lib/router-compat';
import CccdScanner from '../components/CccdScanner';
import {
  verifyRecoveryAccount,
  verifyRecoveryKey,
  verifyRecoveryOtpStep,
  verifyRecoveryBalance,
  verifyRecoveryCccd
} from '../services/authService';
import { initialGroups, initialGroupInvites } from '../data/contactMockData';
import {
  getOrCreateConversation,
  sendMessage,
  uploadFile,
  syncAll,
  getMessages,
  markAsRead,
  hideConversation,
  muteConversation,
  clearMessages,
  reportConversation,
  removeContact
} from '../services/messageService';
import {
  searchUsers,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest
} from '../services/friendService';
import useSupabaseRealtimeAuth from '../custom-hooks/useSupabaseRealtimeAuth';
import useConversationChannel from '../custom-hooks/useConversationChannel';
import useInboxChannel from '../custom-hooks/useInboxChannel';
import usePresence from '../custom-hooks/usePresence';
import ConversationItemMenu from '../components/contact/ConversationItemMenu';
import ContactAvatarMenu from '../components/contact/ContactAvatarMenu';
import PendingListModal from '../components/contact/PendingListModal';
import ContactQrModal from '../components/contact/ContactQrModal';
import CreateGroupPanel from '../components/contact/CreateGroupPanel';
import MapPickerModal from '../components/contact/MapPickerModal';

// ─── Chat mode ────────────────────────────────────────────────────────────────
// mode = null    → no chat selected
// mode = 'user'  → normal user chat
// mode = 'bot'   → bot verification chat (company banner)

// ─── Bot step definitions ─────────────────────────────────────────────────────
const STEPS = {
  GREETING: 'GREETING',
  AWAIT_ACCOUNT: 'AWAIT_ACCOUNT',
  AWAIT_RECOVERY: 'AWAIT_RECOVERY',
  AWAIT_OTP: 'AWAIT_OTP',
  AWAIT_BALANCE: 'AWAIT_BALANCE',
  VERIFYING: 'VERIFYING',
  SUCCESS: 'SUCCESS',
  FAIL_WRONG_INFO: 'FAIL_WRONG_INFO',
  AWAIT_CCCD: 'AWAIT_CCCD',
  CCCD_VERIFIED: 'CCCD_VERIFIED',
  HARD_LOCKED: 'HARD_LOCKED',
};

// ─── Generate temp password ───────────────────────────────────────────────────
function genTempPw() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ─── Bot typing indicator ─────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mb-1">
        <ShieldAlert size={13} className="text-white" />
      </div>
      <div className="bg-white border border-gray-200 px-3 py-2.5 rounded-2xl rounded-bl-sm flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function BotBubble({ msg }) {
  if (msg.sender === 'system') {
    return (
      <div className="flex justify-center my-1">
        <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full">{msg.text}</span>
      </div>
    );
  }
  const isBot = msg.sender === 'bot';
  const colorMap = { error: 'bg-red-50 border-red-200 text-red-700', success: 'bg-green-50 border-green-300 text-green-800', warning: 'bg-orange-50 border-orange-200 text-orange-800', normal: isBot ? 'bg-white border-gray-200 text-gray-800' : '' };
  return (
    <div className={`flex items-end gap-2 ${isBot ? 'justify-start' : 'justify-end'}`}>
      {isBot && (
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mb-1">
          <ShieldAlert size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed border ${isBot ? (colorMap[msg.type] || colorMap.normal) + ' rounded-bl-sm' : 'bg-blue-600 text-white border-blue-600 rounded-br-sm'}`}>
        <span style={{ whiteSpace: 'pre-line' }}>{msg.text}</span>
      </div>
    </div>
  );
}

// ─── Bot Chat Panel ───────────────────────────────────────────────────────────
function BotChatPanel({ onVideoCalls, onGoLogin }) {
  const [messages, setMessages] = useState([]);
  const [step, setStep] = useState(STEPS.GREETING);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [inputDisabled, setInputDisabled] = useState(true);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  // ── Microblink scanning logic ──────────────────────────────────────────────
  const onScanResult = useCallback(async ({ fullName: fullNameRaw, idNumber: idNumberRaw }) => {
    setIsScanModalOpen(false);
    setInputDisabled(true);

    const fullName = fullNameRaw || "";
    const idNumber = idNumberRaw || "";

    if (idNumber) {
      push('system', `📄 Đã quét ID: ${idNumber}`);
      push('system', 'Đang xác minh CCCD với hệ thống...');

      try {
        const res = await verifyRecoveryCccd(dataRef.current.account, fullName, idNumber);
        const success = res?.data?.success || res?.status === 200;

        if (success) {
          const pw = res?.data?.tempPassword || res?.data?.temp_password || genTempPw();
          setStep(STEPS.CCCD_VERIFIED);
          await botSay(
            `✅ XÁC MINH CCCD THÀNH CÔNG!\n\nTên: ${fullName}\nID: ${idNumber}\n\nTài khoản đã được mở khóa.\nMật khẩu tạm thời:\n\n"${pw}"\n\n⏰ Có hiệu lực trong 30 phút.\nVui lòng đăng nhập và đổi mật khẩu ngay.`,
            'success', 1000
          );
        } else {
          // Manually throw to hit catch block if success is false but status was ok
          throw new Error("CCCD Verification Failed");
        }
      } catch (err) {
        setStep(STEPS.HARD_LOCKED);
        await botSay(
          '🔒 CCCD/Mã số thuế không hợp lệ hoặc không khớp với thông tin đã đăng ký.\n\nTài khoản của bạn đã bị khóa hoàn toàn.\nVui lòng liên hệ trực tiếp qua Video Call để được xử lý.',
          'error', 1000
        );
        await botSay('📞 Nhấn nút Video ở góc trên bên phải để kết nối nhân viên hỗ trợ.', 'warning', 600);
        if (onVideoCalls) onVideoCalls();
      }
    }
  }, [onVideoCalls]);

  const hasInitialized = useRef(false);
  const inputRef = useRef(null);
  const endRef = useRef(null);

  // Collected data refs (avoid stale closures)
  const dataRef = useRef({ account: '', recovery: '', otp: '', balance: '' });

  // Scroll to bottom
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  // Countdown timer
  useEffect(() => {
    if (!cooldownUntil) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCountdown(rem);
      if (rem === 0) { clearInterval(iv); setCooldownUntil(null); }
    }, 1000);
    return () => clearInterval(iv);
  }, [cooldownUntil]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const push = (sender, text, type = 'normal') =>
    setMessages(prev => [...prev, { sender, text, type, id: Date.now() + Math.random() }]);

  const botSay = (text, type = 'normal', delayMs = 800) => {
    setIsTyping(true);
    return new Promise(res => setTimeout(() => {
      setIsTyping(false);
      push('bot', text, type);
      res();
    }, delayMs));
  };


  // ── Init greeting ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    (async () => {
      await botSay('🔒 Xin chào! Tôi là hệ thống hỗ trợ tự động.\n\nTôi sẽ giúp bạn xác minh và mở khóa tài khoản bị khóa vĩnh viễn.', 'normal', 900);
      await botSay('Vui lòng nhập Số tài khoản ngân hàng (ID) của bạn để bắt đầu.', 'normal', 700);
      setStep(STEPS.AWAIT_ACCOUNT);
      setInputDisabled(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Standard Failure Handler ──────────────────────────────────────────────
  const handleStandardFail = async () => {
    const attempts = verificationAttempts + 1;
    setVerificationAttempts(attempts);

    if (attempts >= 2) {
      setStep(STEPS.HARD_LOCKED);
      await botSay(
        '🔒 Bạn đã nhập sai quá số lần quy định.\n\nTài khoản của bạn đã bị khóa hoàn toàn.\nVui lòng liên hệ trực tiếp qua Video Call để được xử lý.',
        'error', 1000
      );
      await botSay('📞 Nhấn nút Video ở góc trên bên phải để kết nối nhân viên hỗ trợ.', 'warning', 600);
      if (onVideoCalls) onVideoCalls();
    } else {
      const until = Date.now() + 30 * 60 * 1000; // 30 mins
      setCooldownUntil(until);
      setStep(STEPS.FAIL_WRONG_INFO);

      await botSay(
        '❌ THÔNG TIN KHÔNG CHÍNH XÁC.\n\nVui lòng thử lại sau 30 phút.',
        'error', 800
      );

      // After 30 min, allow retry automatically
      setTimeout(async () => {
        await botSay(
          'Thời gian chờ đã hết. Vui lòng nhập lại số tài khoản để bắt đầu lại quá trình.',
          'warning', 700
        );
        dataRef.current = { account: '', recovery: '', otp: '', balance: '' };
        setStep(STEPS.AWAIT_ACCOUNT);
        setInputDisabled(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }, 30 * 60 * 1000);
    }
  };

  // ── send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const val = input.trim();
    if (!val || inputDisabled) return;
    setInput('');
    setInputDisabled(true);
    push('user', val);

    if (cooldownUntil && Date.now() < cooldownUntil) {
      const rem = Math.ceil((cooldownUntil - Date.now()) / 1000);
      await botSay(`⏳ Vui lòng chờ ${Math.floor(rem / 60)}:${String(rem % 60).padStart(2, '0')} trước khi thử lại.`, 'warning', 500);
      setInputDisabled(false);
      return;
    }

    if (step === STEPS.AWAIT_ACCOUNT) {
      if (!/^\d{1,20}$/.test(val)) {
        await botSay('⚠️ Số tài khoản không hợp lệ (1-20 chữ số). Vui lòng nhập lại.', 'error', 600);
        setInputDisabled(false); return;
      }
      dataRef.current.account = val;
      push('system', 'Đang xác minh số tài khoản...');
      try {
        await verifyRecoveryAccount(val);
        await botSay('✅ Xác minh số tài khoản thành công.\n\nVui lòng nhập Ký tự khôi phục tài khoản của bạn.', 'success', 700);
        setStep(STEPS.AWAIT_RECOVERY);
        setInputDisabled(false);
      } catch (err) {
        await handleStandardFail();
      }
      return;
    }

    if (step === STEPS.AWAIT_RECOVERY) {
      if (val.length < 4) {
        await botSay('⚠️ Ký tự khôi phục phải có ít nhất 4 ký tự. Vui lòng nhập lại.', 'error', 600);
        setInputDisabled(false); return;
      }
      dataRef.current.recovery = val;
      push('system', 'Đang xác minh ký tự khôi phục...');
      try {
        await verifyRecoveryKey(dataRef.current.account, val);
        await botSay('✅ Xác minh ký tự khôi phục thành công.\n\nVui lòng nhập Mật mã OTP của bạn (4-8 chữ số).', 'success', 700);
        setStep(STEPS.AWAIT_OTP);
        setInputDisabled(false);
      } catch (err) {
        await handleStandardFail();
      }
      return;
    }

    if (step === STEPS.AWAIT_OTP) {
      if (!/^\d{4,8}$/.test(val)) {
        await botSay('⚠️ Mật mã OTP không hợp lệ (4-8 chữ số). Vui lòng nhập lại.', 'error', 600);
        setInputDisabled(false); return;
      }
      dataRef.current.otp = val;
      push('system', 'Đang xác minh mã OTP...');
      try {
        await verifyRecoveryOtpStep(dataRef.current.account, val);
        await botSay('✅ Xác minh OTP thành công.\n\nVui lòng nhập Số dư hiện có trong ví (VND, chỉ nhập số).', 'success', 700);
        setStep(STEPS.AWAIT_BALANCE);
        setInputDisabled(false);
      } catch (err) {
        await handleStandardFail();
      }
      return;
    }

    if (step === STEPS.AWAIT_BALANCE) {
      if (!/^\d+$/.test(val)) {
        await botSay('⚠️ Vui lòng nhập số dư dưới dạng số nguyên (VD: 1500000).', 'error', 600);
        setInputDisabled(false); return;
      }
      dataRef.current.balance = val;
      push('system', 'Đang xác minh số dư ví...');
      try {
        const res = await verifyRecoveryBalance(dataRef.current.account, val);
        const pw = res?.data?.tempPassword || res?.data?.temp_password || genTempPw();
        setStep(STEPS.SUCCESS);
        await botSay(
          `🎉 XÁC MINH THÀNH CÔNG!\n\nMật khẩu tạm thời của bạn là:\n\n"${pw}"\n\n⏰ Có hiệu lực trong 30 phút.\nVui lòng đăng nhập và đổi mật khẩu ngay.`,
          'success', 900
        );
      } catch (err) {
        // Balance mismatch triggers CCCD verification
        push('system', '⚠️ Số dư không khớp với hồ sơ.');
        setStep(STEPS.AWAIT_CCCD);
        await botSay(
          'Số dư bạn cung cấp không khớp với hệ thống. Để bảo mật, yêu cầu bổ sung Xác minh danh tính qua thẻ CCCD.',
          'warning', 800
        );
      }
      return;
    }

    setInputDisabled(false);
  };

  // runVerify logic is now integrated into each individual step, but keeping the comment placeholder

  const handleCccdCapture = () => {
    setIsScanModalOpen(true);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const placeholder = {
    [STEPS.AWAIT_ACCOUNT]: 'Nhập số tài khoản ngân hàng (ID)...',
    [STEPS.AWAIT_RECOVERY]: 'Nhập ký tự khôi phục tài khoản...',
    [STEPS.AWAIT_OTP]: 'Nhập mật mã OTP (4-8 chữ số)...',
    [STEPS.AWAIT_BALANCE]: 'Nhập số dư trong ví (VND)...',
  }[step] || 'Nhập tin nhắn...';

  const stepsDone = {
    [STEPS.AWAIT_ACCOUNT]: 0,
    [STEPS.AWAIT_RECOVERY]: 1,
    [STEPS.AWAIT_OTP]: 2,
    [STEPS.AWAIT_BALANCE]: 3,
    [STEPS.VERIFYING]: 4,
  }[step] ?? -1;

  const showCccd = step === STEPS.AWAIT_CCCD;
  const showLogin = step === STEPS.SUCCESS || step === STEPS.CCCD_VERIFIED;
  const showVideoUnlock = step === STEPS.HARD_LOCKED;
  const showInput = !showCccd && !showLogin && step !== STEPS.HARD_LOCKED && step !== STEPS.FAIL_WRONG_INFO;

  return (
    <>
      {/* Progress steps — only during data collection */}
      {stepsDone >= 0 && stepsDone < 4 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 text-[11px]">
          {[
            { icon: CreditCard, label: 'Số TK' },
            { icon: KeyRound, label: 'Ký tự KP' },
            { icon: Wallet, label: 'OTP' },
            { icon: Wallet, label: 'Số dư' },
          ].map((s, i, arr) => (
            <React.Fragment key={i}>
              <div className="flex items-center gap-1">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${i < stepsDone ? 'bg-green-500' : i === stepsDone ? 'bg-blue-500' : 'bg-gray-200'}`}>
                  {i < stepsDone
                    ? <CheckCircle size={11} className="text-white" />
                    : <s.icon size={10} className={i === stepsDone ? 'text-white' : 'text-gray-400'} />}
                </div>
                <span className={i < stepsDone ? 'text-green-600 font-medium' : i === stepsDone ? 'text-blue-600 font-medium' : 'text-gray-400'}>{s.label}</span>
              </div>
              {i < arr.length - 1 && <div className={`flex-1 h-px ${i < stepsDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 bg-[#F4F5F7]">
        {messages.map(msg => <BotBubble key={msg.id} msg={msg} />)}
        {isTyping && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* CCCD action */}
      {showCccd && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex flex-col items-center gap-2">
          <p className="text-xs text-gray-500">Chụp ảnh CCCD / Mã số thuế để xác minh danh tính:</p>
          <button
            onClick={handleCccdCapture}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
          >
            <ScanFace size={18} />
            Xác minh CCCD
          </button>
        </div>
      )}

      {/* Success: go to login */}
      {showLogin && (
        <div className="bg-white border-t border-gray-200 px-4 py-3 flex justify-center">
          <button
            onClick={onGoLogin}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold px-6 py-2.5 rounded-xl transition-all text-sm"
          >
            <CheckCircle size={18} />
            Đến trang Đăng nhập
          </button>
        </div>
      )}

      {/* Hard locked footer */}
      {showVideoUnlock && (
        <div className="bg-red-50 border-t-2 border-red-300 px-4 py-3 flex items-center justify-center gap-3">
          <XCircle size={16} className="text-red-600 flex-shrink-0" />
          <span className="text-red-700 font-bold text-xs">Liên hệ hỗ trợ qua Video Call hoặc trực tiếp</span>
        </div>
      )}

      {/* Cooldown waiting bar */}
      {step === STEPS.FAIL_WRONG_INFO && countdown > 0 && (
        <div className="bg-orange-50 border-t border-orange-200 px-4 py-3 flex items-center justify-center gap-2">
          <RefreshCw size={14} className="text-orange-500 animate-spin" />
          <span className="text-orange-700 font-bold text-xs">
            Thử lại sau: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </span>
        </div>
      )}

      {/* Normal input */}
      {showInput && (
        <div className="h-auto bg-white border-t border-gray-300">
          <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100">
            <div className="font-bold text-gray-500 cursor-pointer hover:text-gray-800">A<span className="text-xs ml-1">v</span></div>
            <ImageIcon className="text-gray-500 cursor-pointer hover:text-gray-800" size={20} />
          </div>
          <div className="flex items-end px-4 py-3 min-h-[60px]">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={inputDisabled || countdown > 0}
              placeholder={countdown > 0 ? `Chờ ${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, '0')}...` : placeholder}
              className="flex-1 max-h-32 min-h-[40px] resize-none border-none outline-none text-[15px] bg-transparent pb-1 disabled:opacity-40"
              rows={1}
            />
            <div className="flex items-center gap-3 ml-2 mb-1">
              <Smile className="text-gray-500 cursor-pointer hover:text-gray-800" size={22} />
              <Mic className="text-gray-500 cursor-pointer hover:text-gray-800" size={22} />
              <button
                onClick={handleSend}
                disabled={inputDisabled || !input.trim() || countdown > 0}
                className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-30 shadow"
              >
                <Send size={14} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {isScanModalOpen && (
        <CccdScanner
          onResult={onScanResult}
          onClose={() => setIsScanModalOpen(false)}
        />
      )}
    </>
  );
}

// ─── Normal Chat Panel (placeholder for regular contacts) ────────────────────
// ─── Normal Chat Panel (Zalo-like Chat Interface) ────────────────────────────
const BUBBLE_COLORS = ['#2563eb', '#16a34a', '#9333ea', '#db2777', '#ea580c'];

// Strapi media host = API base without the trailing /api. Uploaded files are
// served from <host>/uploads/... and come back as relative paths.
const MEDIA_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337/api').replace(/\/api\/?$/, '');

// Resolve an avatar value into a usable <img src>. Handles the shapes the API
// returns it in: a plain URL string (register) or a populated media object
// (login: { url }), and prefixes the host for relative /uploads paths.
const resolveAvatarUrl = (val) => {
  const url = typeof val === 'string'
    ? val
    : (val?.url || val?.data?.attributes?.url || '');
  if (!url) return '';
  return /^(https?:)?\/\//i.test(url) ? url : `${MEDIA_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

// Builds the JSON payload stored in a `contact`-type message's content field.
const buildContactCardPayload = (friend) => JSON.stringify({
  userId: friend.otherUserId || null,
  name: friend.name || friend.displayName || 'Người dùng',
  bankNumber: friend.bankNumber || null,
  avt: friend.avatar || null,
});

// Renders a `contact`-type message as a shared business card (avatar + name + STK).
// Falls back to the raw text if the content isn't the expected JSON payload.
function ContactCardBubble({ raw, isMe, isDark, pending, failed }) {
  let card = null;
  try { card = JSON.parse(raw); } catch { /* legacy / malformed — fall back to text */ }

  if (!card || typeof card !== 'object') {
    return (
      <div
        className={`px-3 py-2 rounded-2xl text-sm break-words ${isMe
          ? 'text-white rounded-br-none'
          : `${isDark ? 'bg-gray-700 border-gray-600 text-red-400' : 'bg-white border-gray-100 text-red-600'} rounded-bl-none border`}`}
      >
        {raw}
      </div>
    );
  }

  const avatar = resolveAvatarUrl(card.avt) || `https://i.pravatar.cc/80?u=${card.userId || card.name || 'x'}`;
  return (
    <div
      className={`w-60 max-w-full rounded-2xl border overflow-hidden ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} ${pending ? 'opacity-60' : ''} ${failed ? 'ring-2 ring-red-400' : ''}`}
    >
      <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border-b border-blue-100">
        Danh thiếp
      </div>
      <div className="flex items-center gap-3 p-3">
        <img src={avatar} alt={card.name || 'avatar'} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
        <div className="min-w-0 text-left">
          <div className={`font-bold text-sm truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{card.name || 'Người dùng'}</div>
          {card.bankNumber && <div className="text-[11px] text-gray-400 truncate">STK: {card.bankNumber}</div>}
        </div>
      </div>
    </div>
  );
}

// Maps a backend message (api::message.message) into the shape NormalChatPanel renders.
const toChatMessage = (msg, currentUserId) => ({
  id: msg.id,
  text: msg.content,
  type: msg.type || 'text',
  imageUrl: msg.type === 'image' ? (msg.attachment?.url || null) : null,
  sender: msg.sender?.id === currentUserId ? 'me' : 'them',
  timestamp: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
});

// Per-device contact nicknames — there's no backend field for this, so it's
// stored locally and merged back in every time conversations are (re)mapped,
// which keeps it from being wiped out by the poll overwriting `friends`.
const NICKNAMES_KEY = 'contactNicknames';
const readNicknames = () => {
  try {
    return JSON.parse(localStorage.getItem(NICKNAMES_KEY) || '{}');
  } catch {
    return {};
  }
};
const getNickname = (conversationId) => readNicknames()[conversationId] || null;
const setNickname = (conversationId, name) => {
  const all = readNicknames();
  all[conversationId] = name;
  localStorage.setItem(NICKNAMES_KEY, JSON.stringify(all));
};

// Maps a backend conversation (api::conversation.conversation) into the shape
// the left-hand contact list renders.
const mapConversation = (convo) => ({
  id: convo.id,
  otherUserId: convo.other_user?.id,
  name: convo.other_user?.full_name || 'Người dùng',
  displayName: getNickname(convo.id) || convo.other_user?.full_name || 'Người dùng',
  bankNumber: convo.other_user?.bank_number || null,
  avatar: resolveAvatarUrl(convo.other_user?.avt) || `https://i.pravatar.cc/150?u=${convo.other_user?.id || convo.id}`,
  lastMessage: convo.last_message || 'Chưa có tin nhắn',
  updatedAt: convo.last_message_at || new Date().toISOString(),
  unread: convo.unread_count || 0,
  muted: !!convo.muted,
  hasUnseenAiLive: false,
  otpPending: false
});

function NormalChatPanel({ contact, t, messages, onSendMessage, onSendImage, peerTyping, onTypingChange }) {
  const [inputText, setInputText] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingStopTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  // Broadcasts "typing" on keystroke (throttled to once per active burst via
  // isTypingRef) and auto-clears to "stopped" after ~2s of inactivity.
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!onTypingChange) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      onTypingChange(true);
    }
    clearTimeout(typingStopTimeoutRef.current);
    typingStopTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      onTypingChange(false);
    }, 2000);
  };

  useEffect(() => () => clearTimeout(typingStopTimeoutRef.current), []);

  // #C-11: own message bubble background color, default blue
  const [bubbleColor, setBubbleColor] = useState(BUBBLE_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);

  // #C-12: dark/light mode toggle, persisted
  const [theme, setTheme] = useState(() => localStorage.getItem('contactTheme') || 'light');
  useEffect(() => { localStorage.setItem('contactTheme', theme); }, [theme]);
  const isDark = theme === 'dark';

  // Auto-scroll to bottom on new messages (or when the typing indicator appears)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, peerTyping]);

  // Guards against a single click/Enter firing twice (e.g. Enter immediately
  // followed by a stray click on the Send button) resulting in two separate
  // messages being sent for the one action.
  const sendingRef = useRef(false);
  const handleSend = () => {
    if (!inputText.trim() || sendingRef.current) return;
    sendingRef.current = true;
    onSendMessage(inputText.trim());
    setInputText('');
    if (isTypingRef.current) {
      isTypingRef.current = false;
      clearTimeout(typingStopTimeoutRef.current);
      onTypingChange?.(false);
    }
    setTimeout(() => { sendingRef.current = false; }, 300);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageSelected = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file || !onSendImage) return;
    setIsUploadingImage(true);
    try {
      await onSendImage(file);
    } finally {
      setIsUploadingImage(false);
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 h-full ${isDark ? 'bg-gray-900' : 'bg-[#F4F5F7]'}`}>
      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
      >
        {messages && messages.length > 0 ? (
          messages.map((msg, idx) => {
            const isMe = msg.sender === 'me'; // #C-12: chủ tài khoản (me) = dark blue, khách hàng (them) = red
            return (
              <div
                key={msg.id || idx}
                className={`flex items-end gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 flex-shrink-0 mb-1">
                    <img
                      src={contact?.avatar || "https://via.placeholder.com/32"}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                {/* max-w lives here (a flex item of the full-width row above) —
                    putting it on a descendant instead resolves the percentage
                    against a shrink-to-fit ancestor and wraps text far too early. */}
                <div className={`flex flex-col max-w-[66%] ${isMe ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'image' && msg.imageUrl ? (
                    <a
                      href={msg.imageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={`block max-w-full rounded-2xl overflow-hidden border transition-opacity ${msg.failed ? 'border-red-300' : 'border-gray-200'} ${msg.pending ? 'opacity-60' : ''}`}
                    >
                      <img src={msg.imageUrl} alt={msg.text || 'Hình ảnh'} className="max-w-full h-auto object-cover" />
                    </a>
                  ) : msg.type === 'contact' ? (
                    <ContactCardBubble raw={msg.text} isMe={isMe} isDark={isDark} pending={msg.pending} failed={msg.failed} />
                  ) : msg.type === 'location' ? (
                    <div
                      style={isMe ? { backgroundColor: bubbleColor } : undefined}
                      className={`px-3 py-2.5 rounded-2xl text-sm relative break-words transition-opacity border ${isMe
                        ? 'text-white border-transparent rounded-br-none'
                        : `${isDark ? 'bg-gray-700 border-gray-600 text-red-400' : 'bg-white border-gray-100 text-red-600'} rounded-bl-none`
                        } ${msg.pending ? 'opacity-60' : ''} ${msg.failed ? 'ring-2 ring-red-400' : ''}`}
                    >
                      <div className="flex flex-col gap-1.5 min-w-[200px]">
                        <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                          <MapPin size={14} className={isMe ? 'text-white' : 'text-red-500'} />
                          <span>Vị trí chia sẻ</span>
                        </div>
                        {msg.text.includes('\n') ? (
                          <>
                            <div className={`text-xs opacity-90 font-medium ${isMe ? 'text-blue-100' : 'text-gray-600 dark:text-gray-300'}`}>
                              {msg.text.split('\n')[1]}
                            </div>
                            <a
                              href={msg.text.split('\n')[2]}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-xs font-bold underline ${isMe ? 'text-white hover:text-blue-100' : 'text-blue-600 hover:text-blue-700'}`}
                            >
                              Xem trên bản đồ ➔
                            </a>
                          </>
                        ) : (
                          <a
                            href={msg.text.replace('📍 Vị trí của tôi: ', '').replace('📍 Vị trí đã chia sẻ: ', '')}
                            target="_blank"
                            rel="noreferrer"
                            className={`text-xs font-bold underline ${isMe ? 'text-white hover:text-blue-100' : 'text-blue-600 hover:text-blue-700'}`}
                          >
                            Xem trên bản đồ ➔
                          </a>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={isMe ? { backgroundColor: bubbleColor } : undefined}
                      className={`px-3 py-2 rounded-2xl text-sm relative break-words transition-opacity ${isMe
                        ? 'text-white rounded-br-none'
                        : `${isDark ? 'bg-gray-700 border-gray-600 text-red-400' : 'bg-white border-gray-100 text-red-600'} rounded-bl-none border`
                        } ${msg.pending ? 'opacity-60' : ''} ${msg.failed ? 'ring-2 ring-red-400' : ''}`}
                    >
                      {msg.text}
                    </div>
                  )}
                  <span className={`flex items-center gap-1 text-[10px] mt-1 px-1 ${msg.failed ? 'text-red-500' : 'text-gray-400'}`}>
                    {msg.pending ? (
                      <>
                        <RefreshCw size={10} className="animate-spin" />
                        Đang gửi...
                      </>
                    ) : msg.failed ? (
                      'Gửi lỗi'
                    ) : (
                      msg.timestamp || "Vừa xong"
                    )}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <p className="text-sm italic">Hãy bắt đầu cuộc trò chuyện với {contact?.name || 'người này'}</p>
          </div>
        )}
        {peerTyping && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 flex-shrink-0 mb-1">
              <img src={contact?.avatar || "https://via.placeholder.com/32"} alt="avatar" className="w-full h-full object-cover" />
            </div>
            <div className={`px-3 py-2.5 rounded-2xl rounded-bl-none flex items-center gap-1 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-100'}`}>
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className={isDark ? 'bg-gray-800 border-t border-gray-700' : 'bg-white border-t border-gray-200'}>
        <div className={`relative flex items-center gap-4 px-4 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-50'}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelected}
          />
          <button type="button" onClick={handlePickImage} disabled={!onSendImage || isUploadingImage} title="Gửi hình ảnh">
            {isUploadingImage
              ? <RefreshCw className="text-blue-500 animate-spin" size={20} />
              : <ImageIcon className={`${onSendImage ? 'text-gray-500 cursor-pointer hover:text-blue-500' : 'text-gray-300 cursor-not-allowed'}`} size={20} />}
          </button>
          <Smile className="text-gray-500 cursor-pointer hover:text-blue-500" size={20} />
          <Mic className="text-gray-500 cursor-pointer hover:text-blue-500" size={20} />

          {/* #C-11: bubble background color swatch with visible "Color / nền" labels */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] text-gray-500 leading-none">Color</span>
            <button
              type="button"
              onClick={() => setShowColorPicker((v) => !v)}
              title="Màu nền tin nhắn"
              className="w-5 h-5 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: bubbleColor }}
            />
            <span className="text-[10px] text-gray-400 leading-none">nền</span>
          </div>
          {showColorPicker && (
            <div className="absolute bottom-full left-12 mb-2 z-30 flex gap-1.5 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1.5">
              {BUBBLE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setBubbleColor(c); setShowColorPicker(false); }}
                  className={`w-5 h-5 rounded-full ${bubbleColor === c ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}

          <div className="flex-1" />

          {/* #C-12: dark/light mode toggle, persisted via localStorage */}
          <button
            type="button"
            onClick={() => setTheme((cur) => (cur === 'dark' ? 'light' : 'dark'))}
            title="Chế độ Đen - Trắng"
            className={`flex items-center gap-1 ${isDark ? 'text-yellow-400' : 'text-gray-400'} hover:text-gray-600`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
            <Settings size={14} />
          </button>
        </div>

        <div className="flex items-end px-3 py-3 gap-2">
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={t('contact.typeMessage', `Nhập tin nhắn tới ${contact?.name || '...'}`)}
            className={`flex-1 max-h-32 min-h-[40px] resize-none border-none outline-none text-sm bg-transparent py-1.5 ${isDark ? 'text-white placeholder:text-gray-500' : ''}`}
            rows={1}
          />
          <button
            disabled={!inputText.trim()}
            onClick={handleSend}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${inputText.trim()
              ? 'bg-blue-600 text-white cursor-pointer active:scale-90'
              : 'text-gray-300 cursor-default'
              }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline invite / scan-result panel (replaces modal popup) ────────────────
function InlineInvitePanel({ title, items, onAccept, onReject, onRename, onClose, acceptLabel = 'ĐỒNG Ý' }) {
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const commitRename = (id) => {
    if (editName.trim()) onRename?.(id, editName.trim());
    setEditingId(null);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <span className="font-bold text-blue-900 text-sm">{title}</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700 text-lg leading-none">✕</button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {items.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">Không có mục nào đang chờ.</div>
        )}
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50">
            <img src={item.avatar || `https://i.pravatar.cc/40?u=${item.id}`} alt={item.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onBlur={() => commitRename(item.id)}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(item.id); if (e.key === 'Escape') setEditingId(null); }}
                  className="border px-2 py-1 rounded w-full text-sm text-blue-900"
                />
              ) : (
                <button
                  type="button"
                  className="text-left w-full"
                  onClick={() => { if (onRename) { setEditingId(item.id); setEditName(item.displayName || item.name || ''); } }}
                >
                  <span className="font-bold text-blue-900 uppercase text-sm">{item.displayName || item.name}</span>
                  {onRename && <span className="text-[10px] text-yellow-600 ml-1">(mở, ấn vào để nhập tên mới)</span>}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => onAccept(item.id)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded flex-shrink-0"
            >
              {acceptLabel}
            </button>
            {onReject && (
              <button
                type="button"
                onClick={() => onReject(item.id)}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex-shrink-0"
              >
                TỪ CHỐI
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function ContactAdminPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 'none' | 'user' | 'bot'
  const [chatMode, setChatMode] = useState('none');
  const [activeContactId, setActiveContactId] = useState(null);
  const [activeContactType, setActiveContactType] = useState(null); // 'friend' | 'group'
  const [videoUnlocked, setVideoUnlocked] = useState(false);
  const [contactMessages, setContactMessages] = useState({
    1: [{ id: 1, text: 'Chào bạn, công ty có thể giúp gì cho bạn?', sender: 'them', timestamp: '10:00' }],
    2: [{ id: 1, text: 'Xin chào!', sender: 'them', timestamp: '09:30' }],
  });

  // #C-01: Cá nhân vs Nhóm tabs
  const [activeTab, setActiveTab] = useState('personal'); // 'personal' | 'group'
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState(initialGroups);
  const [friendRequests, setFriendRequests] = useState([]);
  const [groupInvites, setGroupInvites] = useState(initialGroupInvites);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return null;
    }
  })();
  const currentUserId = currentUser?.id;

  const [chatMessages, setChatMessages] = useState([]);
  const chatMessagesRef = useRef([]);
  chatMessagesRef.current = chatMessages;

  // Refs so the sync loop below always reads the latest active-chat state
  // without needing to be re-created (and re-scheduled) on every change.
  const activeContactIdRef = useRef(null);
  const activeContactTypeRef = useRef(null);
  activeContactIdRef.current = activeContactId;
  activeContactTypeRef.current = activeContactType;
  // Which conversation the current chatMessages array belongs to — lets the
  // sync loop know whether chatMessagesRef's last id is a valid "since" cursor.
  const chatMessagesConvIdRef = useRef(null);
  // The highest real (numeric) message id we've confirmed for the active
  // conversation. Updated directly at every mutation point (not derived from
  // chatMessagesRef, which only reflects the last completed render) so the
  // "since" cursor used below is always accurate even mid-send, before React
  // has re-rendered — otherwise a poll racing a send can pass a stale cursor.
  const lastMessageIdRef = useRef({ convId: null, id: null });

  // Merges newly fetched/pushed messages into chatMessages, deduping by id and
  // advancing the "since" cursor — shared by the initial load, the slow
  // safety-net poll below, and the realtime-driven fetch further down.
  const applyIncomingMessages = (convId, mapped) => {
    chatMessagesConvIdRef.current = convId;
    if (!mapped.length) return;
    const maxId = Math.max(...mapped.map(m => m.id));
    lastMessageIdRef.current = {
      convId,
      id: Math.max(lastMessageIdRef.current.convId === convId ? (lastMessageIdRef.current.id || 0) : 0, maxId)
    };
    // Dedupe by id — a just-sent (optimistically appended) message can also
    // come back here, and races can re-deliver the same rows.
    setChatMessages(prev => {
      const existing = new Set(prev.map(m => m.id));
      const toAdd = mapped.filter(m => !existing.has(m.id));
      return toAdd.length ? [...prev, ...toAdd] : prev;
    });
  };

  // Combined poll: conversations + incoming friend requests + (if a friend
  // chat is open) its new messages, marking them read — kept as a slow
  // (30s) safety net now that realtime carries the live-update load: it
  // keeps friend requests fresh and re-syncs if Realtime silently stalls
  // without emitting a detectable channel-error status.
  const runSync = async () => {
    const convType = activeContactTypeRef.current;
    const convId = convType === 'friend' ? activeContactIdRef.current : null;
    const sinceId = (convId && lastMessageIdRef.current.convId === convId)
      ? lastMessageIdRef.current.id
      : undefined;

    try {
      const data = await syncAll(convId || undefined, sinceId);

      setFriends((data.conversations || []).map(mapConversation));
      setFriendRequests((data.incoming_friend_requests || []).map(r => ({
        id: r.id,
        name: r.from_user?.full_name || 'Người dùng',
        avatar: resolveAvatarUrl(r.from_user?.avt) || `https://i.pravatar.cc/150?u=${r.from_user?.id || r.id}`
      })));

      if (convId) {
        applyIncomingMessages(convId, (data.messages || []).map(msg => toChatMessage(msg, currentUserId)));
      }
    } catch (err) {
      console.error('Error syncing:', err);
    }
  };
  const runSyncRef = useRef(runSync);
  runSyncRef.current = runSync;

  // Fired by the realtime conversation channel (new message broadcast, or on
  // resubscribe after a drop) — a targeted fetch of just the active
  // conversation's new messages, reusing the same populated shape as REST
  // instead of trusting the broadcast payload (which is the bare DB row,
  // missing populated sender/attachment relations). Also marks them read,
  // mirroring what the old combined /sync call did server-side while a
  // conversation was open.
  const fetchNewMessagesForActiveConversation = async () => {
    const convId = activeContactIdRef.current;
    if (activeContactTypeRef.current !== 'friend' || !convId) return;
    const sinceId = lastMessageIdRef.current.convId === convId ? lastMessageIdRef.current.id : undefined;
    try {
      const data = await getMessages(convId, sinceId || '');
      if (data && data.length > 0) {
        applyIncomingMessages(convId, data.map(msg => toChatMessage(msg, currentUserId)));
        markAsRead(convId).catch(err => console.error('Error marking as read:', err));
      }
    } catch (err) {
      console.error('Error fetching new messages:', err);
    }
  };

  // Patches a message's read/seen status in place from a realtime broadcast —
  // no re-fetch needed, the updated row already carries everything used here.
  const applyMessageUpdate = (record) => {
    if (!record) return;
    setChatMessages(prev => prev.map(m => m.id === record.id
      ? { ...m, is_read: record.is_read, read_at: record.read_at }
      : m));
  };

  // Reset the chat pane immediately when switching conversations, then load
  // its messages right away instead of waiting for the channel to deliver one.
  useEffect(() => {
    setChatMessages([]);
    chatMessagesConvIdRef.current = null;
    lastMessageIdRef.current = { convId: null, id: null };
    if (activeContactType === 'friend' && activeContactId) {
      runSyncRef.current();
    }
  }, [activeContactId, activeContactType]);

  // Slow safety-net poll (was the one and only 4s loop before realtime).
  useEffect(() => {
    runSyncRef.current();
    const interval = setInterval(() => runSyncRef.current(), 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Supabase Realtime: replaces the poll for messages + conversation list ──
  const { isAuthReady } = useSupabaseRealtimeAuth(!!currentUserId);

  useInboxChannel({
    userId: currentUserId,
    enabled: isAuthReady,
    onConversationUpdated: (payload) => {
      setFriends(prev => prev.map(f => f.id === payload.conversation_id
        ? {
          ...f,
          lastMessage: payload.last_message || f.lastMessage,
          updatedAt: payload.last_message_at || f.updatedAt
        }
        : f));
    },
  });

  const { peerTyping, sendTyping } = useConversationChannel({
    conversationId: activeContactType === 'friend' ? activeContactId : null,
    enabled: isAuthReady,
    onInsert: fetchNewMessagesForActiveConversation,
    onUpdate: applyMessageUpdate,
    onGapFill: fetchNewMessagesForActiveConversation,
  });

  const { isOnline } = usePresence({ userId: currentUserId, enabled: isAuthReady });

  // #C-03: which item's right-tap quick-action menu is open
  const [openMenuId, setOpenMenuId] = useState(null);
  // Left avatar-side quick-action menu (Ẩn / Xóa tên / Báo cáo)
  const [openAvatarMenuId, setOpenAvatarMenuId] = useState(null);

  // Add-friend search (by bank_number or full_name) — dropdown under the search box
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sentRequestIds, setSentRequestIds] = useState(() => new Set());

  useEffect(() => {
    if (activeTab !== 'personal' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchUsers(searchQuery.trim());
        setSearchResults(results || []);
      } catch (err) {
        console.error('Error searching users:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleSendFriendRequest = async (targetUserId) => {
    try {
      await sendFriendRequest(targetUserId);
      setSentRequestIds(prev => new Set(prev).add(targetUserId));
    } catch (err) {
      // Backend returns 400 for "already friends" / "already pending" — still
      // mark as sent so the button reflects there's nothing more to do here.
      console.error('Error sending friend request:', err);
      setSentRequestIds(prev => new Set(prev).add(targetUserId));
    }
  };

  // #C-05 / #C-07: pending invite list modals
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState(false);
  const [isGroupInvitesOpen, setIsGroupInvitesOpen] = useState(false);

  // #C-06 / #C-09: QR add-friend / join-group flow
  const [isAddFriendQrOpen, setIsAddFriendQrOpen] = useState(false);
  const [isJoinGroupQrOpen, setIsJoinGroupQrOpen] = useState(false);
  const [scannedFriend, setScannedFriend] = useState(null);
  const [scannedGroup, setScannedGroup] = useState(null);

  // #C-08: create/edit group panel
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // #C-14: "gửi danh thiếp" — pick one of my friends and send their card into the chat
  const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);

  // Map selection modal for location sharing
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);


  // inline panel: replaces popup modals for invite/scan-result lists
  const [inlinePanelType, setInlinePanelType] = useState(null); // 'friendRequests' | 'groupInvites' | 'scannedFriend' | 'scannedGroup'

  const currentUserName = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}')?.full_name || 'NGUYỄN VĂN A'; } catch { return 'NGUYỄN VĂN A'; } })();

  // #C-13: ad banner — covered for 5s, then closable, hidden for the rest of the session
  const [showAdBanner, setShowAdBanner] = useState(() => sessionStorage.getItem('contactAdBannerClosed') !== 'true');
  const [canCloseAdBanner, setCanCloseAdBanner] = useState(false);

  useEffect(() => {
    if (!showAdBanner) return;
    const timer = setTimeout(() => setCanCloseAdBanner(true), 5000);
    return () => clearTimeout(timer);
  }, [showAdBanner]);

  const handleCloseAdBanner = () => {
    setShowAdBanner(false);
    sessionStorage.setItem('contactAdBannerClosed', 'true');
  };

  // Appends a local "sending" bubble immediately so the UI never waits on the
  // network round-trip before showing something — replaced by the real
  // message on success, or flagged failed (with a retry) on error.
  const addOptimisticMessage = (draft) => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setChatMessages(prev => [...prev, {
      id: tempId,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      pending: true,
      ...draft
    }]);
    chatMessagesConvIdRef.current = activeContactId;
    return tempId;
  };

  const resolveOptimisticMessage = (tempId, msg) => {
    const mapped = toChatMessage(msg, currentUserId);
    setChatMessages(prev => {
      const withoutTemp = prev.filter(m => m.id !== tempId);
      return withoutTemp.some(m => m.id === mapped.id) ? withoutTemp : [...withoutTemp, mapped];
    });
    // Update the sync cursor immediately — don't wait for a re-render — so a
    // poll firing right after this doesn't refetch (and risk re-appending) it.
    if (activeContactId != null) {
      lastMessageIdRef.current = {
        convId: activeContactId,
        id: Math.max(lastMessageIdRef.current.convId === activeContactId ? (lastMessageIdRef.current.id || 0) : 0, mapped.id)
      };
    }
  };

  const failOptimisticMessage = (tempId) => {
    setChatMessages(prev => prev.map(m => m.id === tempId ? { ...m, pending: false, failed: true } : m));
  };

  const handleSendMessage = async (text, type = 'text', attachmentId) => {
    if (!activeContactId) return;

    if (activeContactType === 'friend') {
      const tempId = addOptimisticMessage({ text, type, imageUrl: null });

      try {
        const msg = await sendMessage(activeContactId, text, type, attachmentId);
        resolveOptimisticMessage(tempId, msg);
        await runSyncRef.current(); // refresh the left-hand list's last-message/order
      } catch (err) {
        console.error('Error sending message:', err);
        failOptimisticMessage(tempId);
      }
    } else {
      const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const newMessage = {
        id: msgId,
        text,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setContactMessages(prev => {
        const current = prev[activeContactId] || [];
        if (current.some(m => m.id === msgId)) return prev; // idempotent guard
        return { ...prev, [activeContactId]: [...current, newMessage] };
      });
    }
  };

  // Uploads an image file then sends it as an image-type message (friend chats only).
  // Shows a local preview immediately (before the upload even starts) via an
  // object URL, so the bubble appears instantly instead of after the upload.
  const handleSendImage = async (file) => {
    if (!activeContactId || activeContactType !== 'friend' || !file) return;

    const localUrl = URL.createObjectURL(file);
    const tempId = addOptimisticMessage({ text: '📷 Hình ảnh', type: 'image', imageUrl: localUrl });

    try {
      const media = await uploadFile(file);
      if (!media?.id) throw new Error('Upload did not return a media id');
      const msg = await sendMessage(activeContactId, '', 'image', media.id);
      resolveOptimisticMessage(tempId, msg);
      URL.revokeObjectURL(localUrl);
      await runSyncRef.current();
    } catch (err) {
      console.error('Error sending image:', err);
      failOptimisticMessage(tempId); // keep the local preview visible alongside the failed state
    }
  };

  const isBotMode = chatMode === 'bot';
  const activeFriend = activeContactType === 'friend' ? friends.find(f => f.id === activeContactId) : null;
  const activeGroup = activeContactType === 'group' ? groups.find(g => g.id === activeContactId) : null;
  const activeContact = activeFriend || activeGroup;

  const handleSelectContact = (id, type) => {
    setActiveContactId(id);
    setActiveContactType(type);
    setChatMode('user');
    if (type === 'friend') {
      setFriends(prev => prev.map(f => f.id === id ? { ...f, hasUnseenAiLive: false } : f));
    }
  };

  const handleSelectCompany = () => {
    setChatMode('bot');
    setActiveContactId(null);
    setActiveContactType(null);
  };

  // #C-03: avatar tap -> the contact's Ai LIVE post (clears the unseen red dot)
  const handleAvatarTap = (e, friend) => {
    e.stopPropagation();
    setFriends(prev => prev.map(f => f.id === friend.id ? { ...f, hasUnseenAiLive: false } : f));
    navigate('/ai-live');
  };

  // #C-03: right-tap ("thả") quick-action menu — "Xóa tin nhắn": clears chat
  // history but keeps the conversation/friendship. Friend conversations are
  // server-driven (overwritten by the sync poll), so this needs a real backend
  // call — a local-only removal would just reappear on the next poll tick.
  const handleDeleteConversation = async (id, type) => {
    if (type === 'friend') {
      try {
        await clearMessages(id);
        if (activeContactId === id) {
          setChatMessages([]);
          chatMessagesConvIdRef.current = id;
        }
        await runSyncRef.current();
      } catch (err) {
        console.error('Error clearing messages:', err);
      }
    } else {
      setGroups(prev => prev.filter(g => g.id !== id));
      if (activeContactId === id) { setChatMode('none'); setActiveContactId(null); setActiveContactType(null); }
    }
  };

  const handleMuteConversation = async (id, type) => {
    if (type === 'friend') {
      // Optimistic flip while the request is in flight; the next sync corrects it if needed.
      setFriends(prev => prev.map(item => item.id === id ? { ...item, muted: !item.muted } : item));
      try {
        await muteConversation(id);
      } catch (err) {
        console.error('Error toggling mute:', err);
        setFriends(prev => prev.map(item => item.id === id ? { ...item, muted: !item.muted } : item));
      }
    } else {
      setGroups(prev => prev.map(item => item.id === id ? { ...item, muted: !item.muted } : item));
    }
  };

  // Avatar-side menu: hide a conversation from my list only (server-side for
  // friends, so it stays hidden across polls/reloads; local-only for groups).
  const handleHideConversation = async (id, type) => {
    if (type === 'friend') {
      setFriends(prev => prev.filter(f => f.id !== id)); // optimistic
      if (activeContactId === id) { setChatMode('none'); setActiveContactId(null); setActiveContactType(null); }
      try {
        await hideConversation(id);
      } catch (err) {
        console.error('Error hiding conversation:', err);
        await runSyncRef.current(); // restore it in the list if the call failed
      }
    } else {
      setGroups(prev => prev.map(item => item.id === id ? { ...item, hidden: true } : item));
      if (activeContactId === id) { setChatMode('none'); setActiveContactId(null); setActiveContactType(null); }
    }
  };

  // Avatar-side menu: report a conversation
  const handleReportConversation = async (id, type) => {
    const list = type === 'friend' ? friends : groups;
    const target = list.find(item => item.id === id);
    if (type === 'friend') {
      try {
        await reportConversation(id);
        window.alert(`Đã gửi báo cáo${target ? ` về "${target.displayName || target.name}"` : ''}. Cảm ơn bạn đã phản hồi.`);
      } catch (err) {
        console.error('Error reporting conversation:', err);
        window.alert('Gửi báo cáo thất bại. Vui lòng thử lại.');
      }
    } else {
      window.alert(`Đã gửi báo cáo${target ? ` về "${target.displayName || target.name}"` : ''}. Cảm ơn bạn đã phản hồi.`);
    }
  };

  // Avatar-side menu: "Xóa tên" — unfriends + deletes the conversation entirely.
  const handleRemoveContact = async (id, type) => {
    if (type === 'friend') {
      const wasActive = activeContactId === id;
      setFriends(prev => prev.filter(f => f.id !== id)); // optimistic
      if (wasActive) { setChatMode('none'); setActiveContactId(null); setActiveContactType(null); setChatMessages([]); }
      try {
        await removeContact(id);
      } catch (err) {
        console.error('Error removing contact:', err);
        await runSyncRef.current(); // restore it in the list if the call failed
      }
    } else {
      setGroups(prev => prev.filter(g => g.id !== id));
      if (activeContactId === id) { setChatMode('none'); setActiveContactId(null); setActiveContactType(null); }
    }
  };

  // Chat header: send selected location (coordinates & address) as a message
  const handleSendLocation = (lat, lng, address) => {
    if (!activeContactId) return;
    const formattedLat = typeof lat === 'number' ? lat.toFixed(6) : lat;
    const formattedLng = typeof lng === 'number' ? lng.toFixed(6) : lng;
    const text = address
      ? `📍 Vị trí đã chia sẻ:\n${address}\nhttps://maps.google.com/?q=${formattedLat},${formattedLng}`
      : `📍 Vị trí đã chia sẻ: https://maps.google.com/?q=${formattedLat},${formattedLng}`;
    handleSendMessage(text, 'location');
  };

  // #C-14: send the selected friend's business card into the current chat
  const handleSendContactCard = (friend) => {
    if (!activeContactId || !friend) return;
    handleSendMessage(buildContactCardPayload(friend), 'contact');
    setIsContactPickerOpen(false);
  };

  const handleRenameConversation = (id, type) => {
    if (type === 'group') {
      // Groups get the full owner-only edit panel (#C-08), not a plain rename
      const group = groups.find(g => g.id === id);
      if (group) { setEditingGroup(group); setIsCreateGroupOpen(true); }
      return;
    }
    const current = friends.find(item => item.id === id);
    const next = window.prompt('Nhập tên hiển thị mới:', current?.displayName || current?.name || '');
    if (!next || !next.trim()) return;
    // No backend field for per-contact nicknames — persisted locally so it
    // survives the sync poll overwriting `friends` (see mapConversation).
    setNickname(id, next.trim());
    setFriends(prev => prev.map(item => item.id === id ? { ...item, displayName: next.trim() } : item));
  };

  // #C-08: create or update a group — only the owner reaches this panel, and
  // members can only be picked from the user's own friends list (enforced by
  // CreateGroupPanel only being given the `friends` array to choose from).
  const handleSaveGroup = ({ id, name, avatar, memberIds }) => {
    if (id) {
      setGroups(prev => prev.map(g => g.id === id ? { ...g, name, avatar, memberIds, updatedAt: new Date().toISOString() } : g));
    } else {
      setGroups(prev => [
        ...prev,
        { id: Date.now(), name, avatar, memberIds, ownerId: 'me', lastMessage: 'Nhóm đã được tạo.', updatedAt: new Date().toISOString(), unread: 0 },
      ]);
    }
    setEditingGroup(null);
  };

  const handleLeaveGroup = (id) => {
    setGroups(prev => prev.filter(g => g.id !== id));
    if (activeContactId === id) { setChatMode('none'); setActiveContactId(null); setActiveContactType(null); }
  };

  // #C-05: friend requests — accept opens the 1-1 conversation with the sender
  const handleAcceptFriendRequest = async (id) => {
    try {
      await acceptFriendRequest(id);
      setFriendRequests(prev => prev.filter(r => r.id !== id));
      await runSyncRef.current(); // picks up the newly-created conversation
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  };

  const handleRejectFriendRequest = async (id) => {
    try {
      await rejectFriendRequest(id);
      setFriendRequests(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error rejecting friend request:', err);
    }
  };

  // #C-07: group invites — accept moves the invite into the groups list
  const handleAcceptGroupInvite = (id) => {
    const invite = groupInvites.find(i => i.id === id);
    if (!invite) return;
    setGroups(prev => [
      ...prev,
      {
        id: invite.id,
        name: invite.name,
        avatar: invite.avatar,
        memberIds: invite.memberIds || [],
        ownerId: invite.ownerId || 'other',
        lastMessage: 'Bạn đã tham gia nhóm.',
        updatedAt: new Date().toISOString(),
        unread: 0,
      },
    ]);
    setGroupInvites(prev => prev.filter(i => i.id !== id));
  };

  const handleRejectGroupInvite = (id) => {
    setGroupInvites(prev => prev.filter(i => i.id !== id));
  };

  // #C-06: QR add-friend — after a successful scan, show a single confirm row
  const handleAddFriendScanResult = (resultText) => {
    setIsAddFriendQrOpen(false);
    let name = resultText;
    let qrUserId = null;
    try {
      const parsed = JSON.parse(resultText);
      name = parsed.name || parsed.fullName || resultText;
      qrUserId = parsed.userId || parsed.id || null;
    } catch {
      if (!isNaN(resultText)) {
        qrUserId = parseInt(resultText, 10);
      }
    }
    setScannedFriend({
      id: qrUserId || `scan-friend-${Date.now()}`,
      userId: qrUserId,
      name,
      avatar: `https://i.pravatar.cc/150?u=${Date.now()}`
    });
    setChatMode('none');
    setActiveContactId(null);
    setActiveContactType(null);
    setInlinePanelType('scannedFriend');
  };

  const handleConfirmScannedFriend = async () => {
    if (!scannedFriend) return;
    try {
      const actualUserId = scannedFriend.userId || parseInt(scannedFriend.id, 10);
      if (!isNaN(actualUserId)) {
        const convo = await getOrCreateConversation(actualUserId);

        // Switching the active chat triggers the sync effect, which refreshes
        // the conversations list and loads this conversation's messages.
        setActiveContactId(convo.id);
        setActiveContactType('friend');
        setChatMode('user');
      }
    } catch (err) {
      console.error('Error confirming scanned friend:', err);
    }
    setScannedFriend(null);
    setInlinePanelType(null);
  };

  // #C-09: QR join-group — after a successful scan, show a single confirm row
  const handleJoinGroupScanResult = (resultText) => {
    setIsJoinGroupQrOpen(false);
    let name = resultText;
    try {
      const parsed = JSON.parse(resultText);
      name = parsed.name || parsed.groupName || resultText;
    } catch { /* raw text QR, use as-is */ }
    setScannedGroup({ id: `scan-group-${Date.now()}`, name, avatar: `https://i.pravatar.cc/150?u=g${Date.now()}` });
    setChatMode('none');
    setActiveContactId(null);
    setActiveContactType(null);
    setInlinePanelType('scannedGroup');
  };

  const handleConfirmScannedGroup = () => {
    if (!scannedGroup) return;
    setGroups(prev => [
      ...prev,
      {
        ...scannedGroup,
        memberIds: [],
        ownerId: 'other',
        lastMessage: 'Bạn đã tham gia nhóm.',
        updatedAt: new Date().toISOString(),
        unread: 0,
      },
    ]);
    setScannedGroup(null);
    setInlinePanelType(null);
  };

  // The Search bar's "thêm bạn/thêm nhóm" and QR icons switch meaning with the active tab
  const handleAddIconClick = () => {
    setChatMode('none');
    setActiveContactId(null);
    setActiveContactType(null);
    setInlinePanelType(activeTab === 'personal' ? 'friendRequests' : 'groupInvites');
  };

  const handleQrIconClick = () => {
    if (activeTab === 'personal') setIsAddFriendQrOpen(true);
    else setIsJoinGroupQrOpen(true);
  };

  // Most recently updated conversation first — hidden items are excluded
  const sortedFriends = [...friends].filter(f => !f.hidden).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const sortedGroups = [...groups].filter(g => !g.hidden).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const listItems = activeTab === 'personal' ? sortedFriends : sortedGroups;

  // Chat header label
  const chatTitle = isBotMode
    ? 'CÔNG TY TNHH ĐẠI NGHĨA TÍN'
    : activeContact ? (activeContact.displayName || activeContact.name) : '';

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden text-sm">

      {/* ── Left-most narrow icon bar (unchanged) ───────────────────────── */}


      {/* ── Middle Contacts Column ──────────────────────────────────────── */}
      <div className="w-[320px] min-w-[320px] bg-white flex flex-col border-r border-gray-300 text-blue-900">

        {/* Stats — #C-02: badges in dark blue */}
        <div className="p-2 border-b border-gray-200">
          <div className="flex justify-between px-2 text-xs font-semibold mb-2">
            <div className="w-12 h-12 rounded-full border-2  flex items-center justify-center bg-gray-100 cursor-pointer relative">
              {resolveAvatarUrl(currentUser?.avt) ? (
                <img src={resolveAvatarUrl(currentUser.avt)} alt="avatar" className="absolute inset-0 w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-xs">Avatar</span>
              )}
              <div style={{ top: 0, left: '100%' }} className="absolute z-10 text-blue-800 ml-1 text-left">{friends.length}</div>
              <div style={{ bottom: 0, left: '100%' }} className="absolute z-10 text-blue-800 ml-1 text-left">5</div>

            </div>
              <div className="w-12 h-12 border-2  flex items-center justify-center bg-gray-100 cursor-pointer relative">
                <Building2 size={30} />
              <div style={{ top: 0, left: '100%' }} className="absolute z-10 text-blue-800 ml-1 text-left">1000</div>
              <div style={{ bottom: 0, left: '100%' }} className="absolute z-10 text-blue-800 ml-1 text-left">10000</div>

            </div>
              <div className="w-12 h-12 border-2  flex items-center justify-center bg-gray-100 cursor-pointer relative">
              <Landmark size={30} />
              <div style={{ top: 0, left: '100%' }} className="absolute z-10 text-blue-800 ml-1 text-left">1</div>
              <div style={{ bottom: 0, left: '100%' }} className="absolute z-10 text-blue-800 ml-1 text-left">1</div>

            </div>
          </div>
        </div>

        {/* #C-01: Cá nhân / Nhóm tabs — placed above search so users pick a purpose first */}
        <div className="flex border-b border-gray-200 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 ${activeTab === 'personal' ? 'bg-blue-800 text-white' : 'text-blue-900 hover:bg-blue-50'}`}
          >
            <User size={15} /> CÁ NHÂN
            <span className={`text-[10px] rounded-full w-5 h-5 flex items-center justify-center ${activeTab === 'personal' ? 'bg-white text-blue-800' : 'bg-blue-800 text-white'}`}>
              {friends.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('group')}
            className={`flex-1 py-2 flex items-center justify-center gap-1.5 ${activeTab === 'group' ? 'bg-blue-800 text-white' : 'text-blue-900 hover:bg-blue-50'}`}
          >
            <UsersRound size={15} /> NHÓM
            <span className={`text-[10px] rounded-full w-5 h-5 flex items-center justify-center ${activeTab === 'group' ? 'bg-white text-blue-800' : 'bg-blue-800 text-white'}`}>
              {groups.length}
            </span>
          </button>
        </div>

        {/* Search Bar — below the tabs so the active tab scopes the search */}
        <div className="relative p-3 flex items-center gap-2 border-b border-gray-200">
          <div className="flex-1 bg-gray-100 flex items-center px-3 py-1.5 rounded-md">
            <Search className="text-gray-500 z-10" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'personal' ? t('contact.searchFriend', 'Tìm theo tên hoặc số TK ngân hàng') : t('contact.search', 'Tìm kiếm')}
              className="bg-transparent border-none outline-none w-full ml-2 text-sm"
            />
          </div>
          <button type="button" onClick={handleAddIconClick} title={activeTab === 'personal' ? 'Lời mời kết bạn' : 'Lời mời vào nhóm'}>
            <UserPlus className="text-blue-800 cursor-pointer" size={20} />
          </button>
          <button type="button" onClick={handleQrIconClick} title="Quét QR">
            <QrCode className="text-blue-800 cursor-pointer" size={20} />
          </button>

          {/* Add-friend search results dropdown */}
          {activeTab === 'personal' && searchQuery.trim() && (
            <div className="absolute left-3 right-3 top-full mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
              {searchLoading ? (
                <div className="px-4 py-3 text-sm text-gray-400">Đang tìm...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">Không tìm thấy người dùng.</div>
              ) : (
                searchResults.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2 hover:bg-blue-50">
                    <img src={resolveAvatarUrl(u.avt) || `https://i.pravatar.cc/40?u=${u.id}`} alt={u.full_name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-blue-900 text-sm truncate">{u.full_name || 'Người dùng'}</div>
                      {u.bank_number && <div className="text-[11px] text-gray-400 truncate">STK: {u.bank_number}</div>}
                    </div>
                    <button
                      type="button"
                      disabled={sentRequestIds.has(u.id)}
                      onClick={() => handleSendFriendRequest(u.id)}
                      className={`px-2.5 py-1 text-xs font-bold rounded flex-shrink-0 ${sentRequestIds.has(u.id) ? 'bg-gray-100 text-gray-400 cursor-default' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                    >
                      {sentRequestIds.has(u.id) ? 'Đã gửi' : 'Kết bạn'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
          {activeTab === 'group' && (
            <button type="button" onClick={() => { setEditingGroup(null); setIsCreateGroupOpen(true); }} title="Tạo nhóm mới">
              <Plus className="text-blue-800 cursor-pointer" size={20} />
            </button>
          )}
        </div>

        {/* Conversation List — #C-03 */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {listItems.map((item) => {
            const isGroup = activeTab === 'group';
            const isActive = activeContactId === item.id && activeContactType === (isGroup ? 'group' : 'friend');
            return (
              <div
                key={item.id}
                className={`relative flex items-start p-3 hover:bg-blue-50 border-b border-gray-100 ${isActive ? 'bg-blue-50' : ''}`}
              >
                {/* Avatar-side ("đứng") 3-dot -> Ẩn / Xóa tên / Báo cáo menu */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpenAvatarMenuId(openAvatarMenuId === item.id ? null : item.id); setOpenMenuId(null); }}
                  className="mr-1 -ml-1 p-0.5 text-blue-400 hover:text-blue-800 flex-shrink-0 self-center"
                >
                  <MoreVertical size={16} />
                </button>

                {openAvatarMenuId === item.id && (
                  <ContactAvatarMenu
                    onHide={() => handleHideConversation(item.id, isGroup ? 'group' : 'friend')}
                    onDelete={() => handleRemoveContact(item.id, isGroup ? 'group' : 'friend')}
                    onReport={() => handleReportConversation(item.id, isGroup ? 'group' : 'friend')}
                    onCloseMenu={() => setOpenAvatarMenuId(null)}
                  />
                )}

                {/* Avatar tap -> Ai LIVE post (friends only); red dot if unseen */}
                <button
                  type="button"
                  onClick={isGroup ? () => handleSelectContact(item.id, 'group') : (e) => handleAvatarTap(e, item)}
                  className="relative flex-shrink-0"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300">
                    <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  {!isGroup && item.hasUnseenAiLive && (
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </button>

                {/* Name / middle area tap -> open chat */}
                <button
                  type="button"
                  onClick={() => handleSelectContact(item.id, isGroup ? 'group' : 'friend')}
                  className="ml-3 flex-1 overflow-hidden text-left"
                >
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 font-bold uppercase truncate">
                      {item.displayName || item.name}
                      {item.muted && <BellOff size={11} className="text-gray-400 flex-shrink-0" />}
                    </span>
                    {item.unread > 0 && (
                      <span className="bg-blue-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold ml-1 flex-shrink-0">
                        {item.unread}
                      </span>
                    )}
                  </div>
                  <div className="text-xs mt-1 truncate text-blue-700">
                    {item.lastMessage}
                    {item.otpPending && <span className="text-orange-600 font-semibold"> (OTP xác nhận)</span>}
                  </div>
                </button>

                {/* Right side tap ("thả") -> quick-action dropdown */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                  className="ml-1 p-1 text-blue-400 hover:text-blue-800 flex-shrink-0"
                >
                  <MoreVertical size={16} />
                </button>

                {openMenuId === item.id && (
                  <ConversationItemMenu
                    isGroup={isGroup}
                    onDelete={() => handleDeleteConversation(item.id, isGroup ? 'group' : 'friend')}
                    onMute={() => handleMuteConversation(item.id, isGroup ? 'group' : 'friend')}
                    onRename={() => handleRenameConversation(item.id, isGroup ? 'group' : 'friend')}
                    onLeaveGroup={isGroup ? () => handleLeaveGroup(item.id) : undefined}
                    onCloseMenu={() => setOpenMenuId(null)}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom company button — the promo banner overlays and blocks it until
            closed (#C-13), so users must dismiss the ad before they can tap it. */}
        <div className="relative flex-shrink-0">
          {/* Company button — click to open bot (disabled while the ad covers it) */}
          <div
            onClick={showAdBanner ? undefined : handleSelectCompany}
            className={`p-4 border-t border-gray-200 text-center transition-colors ${showAdBanner ? 'cursor-default' : 'cursor-pointer'} ${isBotMode ? 'bg-blue-50' : (!showAdBanner ? 'hover:bg-gray-50' : '')}`}
          >
            <div className={`font-bold uppercase text-sm flex items-center justify-center gap-2 ${isBotMode ? 'text-blue-800' : 'text-blue-800 hover:text-blue-900'}`}>
              {isBotMode && <ShieldAlert size={14} className="text-blue-800" />}
              CÔNG TY TNHH ĐẠI NGHĨA TÍN
            </div>
            {!isBotMode && (
              <div className="text-[10px] text-gray-400 mt-0.5">Nhấn để xác minh tài khoản bị khóa</div>
            )}
          </div>

          {/* #C-13: promo overlay — sits on top of the company button so it can't
              be clicked; after 5s an X appears to close the ad for the session,
              which reveals and re-enables the button underneath. */}
          {showAdBanner && (
            <div className="absolute inset-0 z-20 bg-blue-50 border-t border-blue-100 px-3 flex items-center gap-2 text-blue-900">
              <Megaphone size={16} className="flex-shrink-0" />
              <span className="text-xs flex-1">Khuyến mãi đặc biệt dành cho thành viên mới!</span>
              {canCloseAdBanner && (
                <button
                  type="button"
                  onClick={handleCloseAdBanner}
                  className="text-blue-400 hover:text-blue-800 flex-shrink-0"
                >
                  <XCircle size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#F4F5F7]">

        {/* Header */}
        <div className="h-[60px] bg-white border-b border-gray-300 flex items-center justify-between px-4 flex-shrink-0">
          {inlinePanelType ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <User size={20} className="text-gray-500" />
                </div>
                <div>
                  <div className="font-bold text-gray-800 uppercase">{currentUserName}</div>
                  <div className="text-[10px] text-yellow-500">tên người dùng nhắn tin với mình</div>
                </div>
              </div>
              <button type="button" onClick={() => setInlinePanelType(null)} className="text-gray-400 hover:text-gray-700 text-xl leading-none px-2">✕</button>
            </>
          ) : chatMode !== 'none' ? (
            <>
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
                  {isBotMode
                    ? <ShieldAlert size={20} className="text-blue-600" />
                    : <img src={activeContact?.avatar || "https://via.placeholder.com/40"} alt="avatar" className="w-full h-full object-cover" />
                  }
                  {!isBotMode && activeContactType === 'friend' && activeFriend?.otherUserId && isOnline(activeFriend.otherUserId) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white" />
                  )}
                </div>
                <div>
                  <div className={`font-bold uppercase ${isBotMode ? 'text-blue-700' : 'text-gray-800'}`}>
                    {chatTitle}
                  </div>
                  {!isBotMode && activeContactType === 'friend' && peerTyping && (
                    <div className="text-[11px] text-blue-500 normal-case">đang nhập...</div>
                  )}
                </div>
              </div>
              <div className={`relative flex items-center gap-2 bg-blue-400 p-1 rounded ${isBotMode && !videoUnlocked ? 'opacity-40' : ''}`}>
                <div className="w-8 h-8 rounded border border-blue-600 flex items-center justify-center cursor-pointer text-white hover:bg-blue-500">
                  <Phone size={18} />
                </div>
                <div className="w-8 h-8 rounded border border-blue-600 flex items-center justify-center cursor-pointer text-white hover:bg-blue-500">
                  <Video size={18} />
                </div>
                {/* Location — select from map or send current position */}
                <button
                  type="button"
                  onClick={() => setIsMapPickerOpen(true)}
                  title="Gửi vị trí"
                  className="w-8 h-8 rounded border border-blue-600 flex items-center justify-center cursor-pointer text-white hover:bg-blue-500"
                >
                  <MapPin size={18} />
                </button>
                {/* #C-14: share a friend's business card into this chat */}
                <button
                  type="button"
                  onClick={() => setIsContactPickerOpen(true)}
                  title="Gửi danh thiếp một người bạn"
                  disabled={isBotMode}
                  className="w-8 h-8 rounded border border-blue-600 flex items-center justify-center cursor-pointer text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <User size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center overflow-hidden">
                <img src="/src/assets/logo.png" alt="logo" className="w-8" onError={e => { e.target.style.display = 'none'; }} />
              </div>
              <div className="font-bold text-blue-700 uppercase">
                CÔNG TY TNHH ĐẠI NGHĨA TÍN
              </div>
            </div>
          )}
        </div>

        {/* ── Conditional chat body ─────────────────────────────────────── */}
        {inlinePanelType === 'friendRequests' ? (
          <InlineInvitePanel
            title="Lời mời kết bạn"
            items={friendRequests}
            onAccept={handleAcceptFriendRequest}
            onReject={handleRejectFriendRequest}
            onClose={() => setInlinePanelType(null)}
          />
        ) : inlinePanelType === 'groupInvites' ? (
          <InlineInvitePanel
            title="Lời mời vào nhóm"
            items={groupInvites}
            onAccept={handleAcceptGroupInvite}
            onReject={handleRejectGroupInvite}
            onClose={() => setInlinePanelType(null)}
          />
        ) : inlinePanelType === 'scannedFriend' && scannedFriend ? (
          <InlineInvitePanel
            title="Kết bạn qua QR"
            items={[scannedFriend]}
            onAccept={handleConfirmScannedFriend}
            onRename={(id, name) => setScannedFriend(prev => prev ? { ...prev, displayName: name } : prev)}
            onClose={() => { setScannedFriend(null); setInlinePanelType(null); }}
            acceptLabel="KẾT BẠN"
          />
        ) : inlinePanelType === 'scannedGroup' && scannedGroup ? (
          <InlineInvitePanel
            title="Tham gia nhóm qua QR"
            items={[scannedGroup]}
            onAccept={handleConfirmScannedGroup}
            onClose={() => { setScannedGroup(null); setInlinePanelType(null); }}
            acceptLabel="ĐỒNG Ý"
          />
        ) : isBotMode ? (
          <BotChatPanel onVideoCalls={() => setVideoUnlocked(true)} onGoLogin={() => navigate('/login')} />
        ) : (
          <NormalChatPanel
            contact={activeContact}
            t={t}
            messages={activeContactType === 'friend' ? chatMessages : (contactMessages[activeContactId] || [])}
            onSendMessage={handleSendMessage}
            onSendImage={activeContactType === 'friend' ? handleSendImage : undefined}
            peerTyping={activeContactType === 'friend' ? peerTyping : false}
            onTypingChange={activeContactType === 'friend'
              ? (isTyping) => sendTyping(currentUserId, isTyping)
              : undefined}
          />
        )}
      </div>

      {/* #C-06: scan a friend's QR to add them — result shown inline */}
      <ContactQrModal
        isOpen={isAddFriendQrOpen}
        onClose={() => setIsAddFriendQrOpen(false)}
        onScanResult={handleAddFriendScanResult}
        myQrLabel="Mã QR của bạn — cho người khác quét để kết bạn"
        myPayload={currentUserId ? { userId: currentUserId, name: currentUserName } : null}
      />

      {/* #C-09: scan a group's QR to join it — result shown inline. Groups are
          still local-only mock data (no backend group API yet), so there's no
          real group id to encode — kept as a placeholder until groups exist server-side. */}
      <ContactQrModal
        isOpen={isJoinGroupQrOpen}
        onClose={() => setIsJoinGroupQrOpen(false)}
        onScanResult={handleJoinGroupScanResult}
        myQrLabel="Mã QR nhóm của bạn — cho người khác quét để tham gia"
        myPayload={null}
      />

      {/* #C-08: create/edit group — owner-only, members from own friends list only */}
      <CreateGroupPanel
        isOpen={isCreateGroupOpen}
        onClose={() => { setIsCreateGroupOpen(false); setEditingGroup(null); }}
        friends={friends}
        existingGroup={editingGroup}
        onSave={handleSaveGroup}
      />

      {/* Map selection modal to select and send locations */}
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        onSendLocation={handleSendLocation}
      />

      {/* #C-14: pick one of my friends to send their business card into the chat */}
      {isContactPickerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => setIsContactPickerOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <div className="font-bold text-blue-900">Gửi danh thiếp</div>
              <button
                type="button"
                onClick={() => setIsContactPickerOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {sortedFriends.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-400">Bạn chưa có người bạn nào để gửi danh thiếp.</div>
              ) : (
                sortedFriends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => handleSendContactCard(friend)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 text-left"
                  >
                    <img src={friend.avatar} alt={friend.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-blue-900 truncate">{friend.displayName || friend.name}</div>
                      {friend.bankNumber && <div className="text-[11px] text-gray-400 truncate">STK: {friend.bankNumber}</div>}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
