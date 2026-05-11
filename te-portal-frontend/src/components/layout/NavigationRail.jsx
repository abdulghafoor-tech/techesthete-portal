import React from 'react';
import { Home, MessageSquare, Bell, Files, MoreHorizontal, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { updateWorkspace } from '../../redux/slices/workspaceSlice';
import fileApi from '../../api/fileApi';
import { getImageUrl } from '../../utils/imageUtils';

const NavItem = ({ icon: Icon, label, active }) => (
    <button className={`w-full py-2 flex flex-col items-center justify-center gap-1 transition-colors group ${active ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>
        <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-blue-100' : 'group-hover:bg-slate-200'}`}>
            <Icon size={22} strokeWidth={active ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-semibold">{label}</span>
    </button>
);

const NavigationRail = () => {
    const dispatch = useDispatch();
    const { currentWorkspace } = useSelector(state => state.workspace);

    // File input ref for workspace logo
    const workspaceFileInputRef = React.useRef(null);

    const handleWorkspaceLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !currentWorkspace) return;

        try {
            const uploadResponse = await fileApi.uploadFile(file);
            if (uploadResponse.file && uploadResponse.file.url) {
                await dispatch(updateWorkspace({
                    workspaceId: currentWorkspace.id,
                    data: { logo: uploadResponse.file.url }
                })).unwrap();
            }
        } catch (error) {
            console.error("Failed to upload workspace logo:", error);
        }
    };

    const logoUrl = getImageUrl(currentWorkspace?.logo);

    return (
        <div className="w-[72px] bg-slate-50 flex flex-col items-center py-4 border-r border-slate-200 shrink-0 relative">
            {/* Workspace Switcher / Logo */}
            <div
                className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-800 font-bold mb-6 border border-slate-200 hover:border-blue-400 cursor-pointer transition-all overflow-hidden relative group"
                onClick={() => workspaceFileInputRef.current?.click()}
                title="Click to change workspace logo"
            >
                {logoUrl ? (
                    <img src={logoUrl} alt={currentWorkspace.name} className="w-full h-full object-cover" />
                ) : (
                    <span>{currentWorkspace?.name?.substring(0, 2).toUpperCase() || 'TE'}</span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-white font-medium">Edit</span>
                </div>
            </div>
            <input
                type="file"
                ref={workspaceFileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleWorkspaceLogoUpload}
            />

            <div className="w-full space-y-2">
                <NavItem icon={Home} label="Home" active />
                <NavItem icon={MessageSquare} label="DMs" />
                <NavItem icon={Bell} label="Activity" />
                <NavItem icon={Files} label="Files" />
                <NavItem icon={MoreHorizontal} label="More" />
            </div>

            <div className="mt-auto flex flex-col items-center gap-4">
                {/* Add/Plus Button */}
                <button className="w-10 h-10 bg-slate-200 hover:bg-slate-300 rounded-xl flex items-center justify-center text-slate-600 transition shadow-sm">
                    <Plus size={20} />
                </button>
            </div>
        </div>
    );
};

export default NavigationRail;
