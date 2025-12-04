import { useState, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { FiArrowLeft, FiEdit, FiEye, FiEyeOff, FiLock, FiMoon, FiSun, FiTrash } from "react-icons/fi";
import { IoMdNotifications, IoMdHelpCircle, IoMdPhonePortrait } from "react-icons/io";
import { FaPalette, FaFont, FaBell, FaDatabase, FaLanguage, FaUser,  FaLock, FaBellSlash, FaVolumeUp,  FaImage, FaGlobe, FaUsers, FaBan, FaClock,   FaNetworkWired, FaMobileAlt, FaWifi, FaEye, FaCheck, FaFileExport, FaInfo } from "react-icons/fa";
import { MdSecurity, MdDeleteForever, MdHelpCenter, MdPolicy, MdWallpaper, MdBackup, MdAddReaction } from "react-icons/md";
import { PhoneCall, Vibrate, Wallpaper } from "lucide-react";
import toast from "react-hot-toast";
import { IoEnter } from "react-icons/io5";

export default function Settings() {
  const { authUser, updateProfile, logout } = useAuthStore();
  const { setSidebarContent, isSoundEnabled, toggleSound } = useChatStore();
  const [currentSection, setCurrentSection] = useState("main");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    about: authUser?.about || "Hey there, come let's chat",
    email: authUser?.email || "",
    profilePic: authUser?.profilePic || "",
  });
  const [theme, setTheme] = useState("dark"); // dark, light
  const [fontSize, setFontSize] = useState("medium"); // small, medium, large
  const [enterIsSend, setEnterIsSend] = useState(true);
  const [mediaAutoDownload, setMediaAutoDownload] = useState({ mobile: true, wifi: true, roaming: false });
  const [disappearingMessages, setDisappearingMessages] = useState("off"); // off, 24hours, 7days, 90days
  const [lastSeenVisibility, setLastSeenVisibility] = useState("everyone"); // everyone, contacts, contacts_except, nobody
  const [onlineStatusVisibility, setOnlineStatusVisibility] = useState("everyone");
  const [profilePhotoVisibility, setProfilePhotoVisibility] = useState("everyone");
  const [aboutVisibility, setAboutVisibility] = useState("everyone");
  const [statusVisibility, setStatusVisibility] = useState("contacts");
  const [groupAddPermission, setGroupAddPermission] = useState("everyone");
  const [readReceipts, setReadReceipts] = useState(true);
  const [appLock, setAppLock] = useState(false);
  const [messageTone, setMessageTone] = useState("default");
  const [vibrate, setVibrate] = useState("default");
  const [popupNotification, setPopupNotification] = useState("always");
  const [showPreview, setShowPreview] = useState(true);
  const [reactionNotifications, setReactionNotifications] = useState(true);
  const [groupNotifications, setGroupNotifications] = useState({ tone: "default", vibrate: "default" });
  const [callRingtone, setCallRingtone] = useState("default");
  const [callVibrate, setCallVibrate] = useState("default");
  const [language, setLanguage] = useState("english");
  const [chatWallpaper, setChatWallpaper] = useState("default");
  const [chatColorTheme, setChatColorTheme] = useState("default");
  const [mediaVisibility, setMediaVisibility] = useState(true); // Show in gallery
  const [backupFrequency, setBackupFrequency] = useState("daily");
  const [selectedImg, setSelectedImg] = useState(authUser?.profilePic || "/avatar.png");
  const fileInputRef = useRef(null);
  const wallpaperInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
    formData.profilePic =  base64Image;
      //await updateProfile({ profilePic: base64Image });
    //  toast.success("Profile picture updated");
    };
  };

  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setChatWallpaper(reader.result);
      toast.success("Chat wallpaper updated");
    };
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      setEditMode(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const toggleTheme = () => {
//    
 };

  const clearChatStorage = () => {
    toast.success("Chat storage cleared");
  };

  const exportChatHistory = () => {
    toast.success("Chat history exported");
  };

  const deleteAccount = () => {
    toast.success("Account deletion requested");
  };

  const renderMain = () => (
    <div className="space-y-4">
      {/* Profile Preview */}
      <div 
        className="bg-[var(--bg-main)] rounded-lg p-4 flex items-center  gap-4 cursor-pointer "
        onClick={() => setCurrentSection("profile")}
      >
        <img
          src={selectedImg}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <p style={{color: authUser.color}} className="font-semibold text-[var(--text-primary)] capitalize ">{formData.fullName}</p>
          <p className="text-[var(--text-secondary)] text-sm">{formData.about}</p>
        </div>
      </div>

      {/* Settings Options */}
      <div className="space-y-2">
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("privacy")}
        >
          <FiLock className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Privacy</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("chats")}
        >
          <IoMdPhonePortrait className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Chats</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("notifications")}
        >
          <FaBell className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Notifications</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("storage")}
        >
          <FaDatabase className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Storage and Data</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("language")}
        >
          <FaLanguage className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Language</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("help")}
        >
          <IoMdHelpCircle className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Help</span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 bg-[var(--bg-main)] rounded-lg cursor-pointer py-7 hover:bg-cyan-700"
          onClick={() => setCurrentSection("account")}
        >
          <MdSecurity className="size-5 text-[var(--text-primary)] hover:text-[var(--text-primary)]" />
          <span className="text-[var(--text-primary)]">Account</span>
        </div>
      </div>

      {/* Logout */}
      <button onClick={logout} className="auth-btn w-full bg-red-600 hover:bg-red-500">
        Logout
      </button>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <div className="flex flex-col items-center gap-4">
        <div className="relative group w-24 h-24 rounded-full overflow-hidden">
          <img
            src={selectedImg}
            alt="Profile"
            className="w-full h-full object-cover"
          />
          <div
            className="absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <FiEdit className="w-6 h-6 text-white" />
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        {editMode ? (
          <div className="w-full space-y-4">
            <input
              type="text"
              value={formData.fullName.toLowerCase()}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input w-full capitalize"
              placeholder="Full Name"
            />
            <input
              type="text"
              value={formData.about}
              onChange={(e) => setFormData({ ...formData, about: e.target.value })}
              className="input w-full"
              placeholder="About"
            />
           
            <button onClick={handleSaveProfile} className="auth-btn w-full">
              Save
            </button>
            <button onClick={() => setEditMode(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              Cancel
            </button>
          </div>
        ) : (
          <div className="text-center space-y-1 w-full">
            <p style={{color: authUser.color}} className="text-[var(--text-primary)] font-medium capitalize">{formData.fullName}</p>
            <p className="text-[var(--text-secondary)] text-sm">{formData.about}</p>
            <p className="text-[var(--text-secondary)] text-sm">{formData.email}</p>
            <button onClick={() => setEditMode(true)} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mx-auto">
              <FiEdit className="size-4" />
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Privacy</h3>
      <div className="space-y-4">
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaClock /> Default Message Timer</span>
          <select
            value={disappearingMessages}
            onChange={(e) => setDisappearingMessages(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="off">Off</option>
            <option value="24hours">24 Hours</option>
            <option value="7days">7 Days</option>
            <option value="90days">90 Days</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaEye/> Last Seen & Online</span>
          <select
            value={lastSeenVisibility}
            onChange={(e) => setLastSeenVisibility(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">My Contacts</option>
            <option value="contacts_except">My Contacts Except...</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaUser /> Profile Photo</span>
          <select
            value={profilePhotoVisibility}
            onChange={(e) => setProfilePhotoVisibility(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">My Contacts</option>
            <option value="contacts_except">My Contacts Except...</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaUser /> About</span>
          <select
            value={aboutVisibility}
            onChange={(e) => setAboutVisibility(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">My Contacts</option>
            <option value="contacts_except">My Contacts Except...</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaGlobe /> Status</span>
          <select
            value={statusVisibility}
            onChange={(e) => setStatusVisibility(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">My Contacts</option>
            <option value="contacts_except">My Contacts Except...</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaCheck /> Read Receipts</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={() => setReadReceipts(!readReceipts)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
          </label>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaUsers /> Who Can Add Me to Groups</span>
          <select
            value={groupAddPermission}
            onChange={(e) => setGroupAddPermission(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="everyone">Everyone</option>
            <option value="contacts">My Contacts</option>
            <option value="contacts_except">My Contacts Except...</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaBan /> Blocked Contacts</span>
          <button className="text-cyan-400 hover:text-cyan-300">Manage</button>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaLock /> App Lock</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appLock}
              onChange={() => setAppLock(!appLock)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
          </label>
        </div>
      </div>
    </div>
  );

  const renderChats = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Chats</h3>
      <div className="space-y-4">
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FiMoon /> Theme</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
          >
            {theme === "dark" ? <FiMoon className="size-5" /> : <FiSun className="size-5" />}
            {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </button>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><MdWallpaper /> Wallpaper</span>
          <button 
            onClick={() => wallpaperInputRef.current.click()}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            <Wallpaper className="size-4" />
            Change
          </button>
          <input
            type="file"
            accept="image/*"
            ref={wallpaperInputRef}
            onChange={handleWallpaperUpload}
            className="hidden"
          />
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaPalette /> Color Theme</span>
          <select
            value={chatColorTheme}
            onChange={(e) => setChatColorTheme(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="blue">Blue</option>
            <option value="green">Green</option>
            <option value="purple">Purple</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaFont /> Font Size</span>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaImage /> Media Visibility</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={mediaVisibility}
              onChange={() => setMediaVisibility(!mediaVisibility)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
          </label>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><IoEnter /> Enter is Send</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={enterIsSend}
              onChange={() => setEnterIsSend(!enterIsSend)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
          </label>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><MdBackup /> Chat Backup</span>
          <select
            value={backupFrequency}
            onChange={(e) => setBackupFrequency(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="never">Never</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <button onClick={exportChatHistory} className="w-full text-left text-[var(--text-secondary)] hover:text-cyan-400 flex items-center gap-2">
          <FaFileExport className="size-5" />
          Export Chat History
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Notifications</h3>
      <div className="space-y-4">
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaVolumeUp /> Message Tone</span>
          <select
            value={messageTone}
            onChange={(e) => setMessageTone(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="tone1">Tone 1</option>
            <option value="tone2">Tone 2</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><Vibrate /> Vibrate</span>
          <select
            value={vibrate}
            onChange={(e) => setVibrate(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="short">Short</option>
            <option value="long">Long</option>
            <option value="off">Off</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaBell /> Popup Notification</span>
          <select
            value={popupNotification}
            onChange={(e) => setPopupNotification(e.target.value)}
            className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
          >
            <option value="always">Always show popup</option>
            <option value="screen_on">Only when screen on</option>
            <option value="screen_off">Only when screen off</option>
            <option value="never">No popup</option>
          </select>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaEye /> Show Preview</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showPreview}
              onChange={() => setShowPreview(!showPreview)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
          </label>
        </div>
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><MdAddReaction /> Reaction Notifications</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reactionNotifications}
              onChange={() => setReactionNotifications(!reactionNotifications)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
          </label>
        </div>
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-[var(--text-primary)] font-medium">Groups</h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaVolumeUp /> Tone</span>
            <select
              value={groupNotifications.tone}
              onChange={(e) => setGroupNotifications({ ...groupNotifications, tone: e.target.value })}
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="tone1">Tone 1</option>
              <option value="tone2">Tone 2</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><Vibrate /> Vibrate</span>
            <select
              value={groupNotifications.vibrate}
              onChange={(e) => setGroupNotifications({ ...groupNotifications, vibrate: e.target.value })}
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="short">Short</option>
              <option value="long">Long</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-[var(--text-primary)] font-medium">Calls</h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaVolumeUp /> Ringtone</span>
            <select
              value={callRingtone}
              onChange={(e) => setCallRingtone(e.target.value)}
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="ring1">Ring 1</option>
              <option value="ring2">Ring 2</option>
            </select>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><Vibrate /> Vibrate</span>
            <select
              value={callVibrate}
              onChange={(e) => setCallVibrate(e.target.value)}
              className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 mt-0 w-full cursor-pointer"
            >
              <option value="default">Default</option>
              <option value="always">Always</option>
              <option value="off">Off</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStorage = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Storage and Data</h3>
      <div className="space-y-4">
        <div className="w-full bg-[var(--bg-main)] px-2 gap-2 py-3">
          <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaNetworkWired /> Network Usage</span>
          <button className="text-cyan-400 hover:text-cyan-300">View</button>
        </div>
        <button onClick={clearChatStorage} className="w-full text-left text-[var(--text-secondary)] hover:text-cyan-400 flex items-center gap-2">
          <FiTrash className="size-5" />
          Manage Storage
        </button>
        <div className="border-t border-slate-700 pt-4">
          <h4 className="text-[var(--text-primary)] font-medium">Media Auto-Download</h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaMobileAlt /> Using Mobile Data</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mediaAutoDownload.mobile}
                onChange={() => setMediaAutoDownload({ ...mediaAutoDownload, mobile: !mediaAutoDownload.mobile })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
            </label>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaWifi /> Connected to Wi-Fi</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mediaAutoDownload.wifi}
                onChange={() => setMediaAutoDownload({ ...mediaAutoDownload, wifi: !mediaAutoDownload.wifi })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
            </label>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[var(--text-secondary)] flex items-center gap-2 mb-3"><FaGlobe /> Data Roaming</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={mediaAutoDownload.roaming}
                onChange={() => setMediaAutoDownload({ ...mediaAutoDownload, roaming: !mediaAutoDownload.roaming })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-400"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLanguage = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Language</h3>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded p-2 w-full"
      >
        <option value="english">English</option>
        <option value="spanish">Spanish</option>
        <option value="french">French</option>
        <option value="german">German</option>
        <option value="hindi">Hindi</option>
        {/* Add more */}
      </select>
    </div>
  );

  const renderHelp = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Help</h3>
      <div className="space-y-4 text-[var(--text-secondary)] text-sm">
        <button className="w-full text-left hover:text-cyan-400 flex items-center gap-2">
          <MdHelpCenter className="size-5" />
          Help Center
        </button>
        <button className="w-full text-left hover:text-cyan-400 flex items-center gap-2">
          <MdPolicy className="size-5" />
          Terms & Privacy Policy
        </button>
        <p>Contact support or view FAQs.</p>
      </div>
    </div>
  );

  const renderAccount = () => (
    <div className="space-y-4">
      <button
        onClick={() => setCurrentSection("main")}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-cyan-400"
      >
        <FiArrowLeft className="size-5" />
        Back
      </button>
      <h3 className="text-cyan-600 font-semibold text-lg">Account</h3>
      <div className="space-y-4">
        <button className="w-full text-left text-[var(--text-secondary)] hover:text-cyan-400 flex items-center gap-2">
          <MdSecurity className="size-5" />
          Two-Step Verification
        </button>
        <button className="w-full text-left text-[var(--text-secondary)] hover:text-cyan-400 flex items-center gap-2">
          <PhoneCall className="size-5" />
          Change Number
        </button>
        <button className="w-full text-left text-[var(--text-secondary)] hover:text-cyan-400 flex items-center gap-2">
          <FaInfo className="size-5" />
          Request Account Info
        </button>
        <button onClick={deleteAccount} className="w-full text-left text-red-400 hover:text-red-300 flex items-center gap-2">
          <MdDeleteForever className="size-5" />
          Delete My Account
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto bg-[var(--bg-secondary)] backdrop-blur-sm gap-3">
      {currentSection === "main" && renderMain()}
      {currentSection === "profile" && renderProfile()}
      {currentSection === "privacy" && renderPrivacy()}
      {currentSection === "chats" && renderChats()}
      {currentSection === "notifications" && renderNotifications()}
      {currentSection === "storage" && renderStorage()}
      {currentSection === "language" && renderLanguage()}
      {currentSection === "help" && renderHelp()}
      {currentSection === "account" && renderAccount()}
    </div>
  );
}

