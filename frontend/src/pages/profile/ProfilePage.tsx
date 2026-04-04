import { useState, useEffect } from 'react';
import { useRefreshWithToast } from '../../hooks/useRefreshWithToast';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Form';
import { LoadingSpinner } from '../../components/ui/Loading';
import { useAuth } from '../../context/AuthContext';
import { ImageUpload } from '../../components/ui/ImageUpload';

import { usersApi } from '../../api/users';

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { refreshWithSuccess, refreshWithError } = useRefreshWithToast();

  console.log('ProfilePage render - user:', user);

  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  
  // Form data for profile
  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    telephone: '',
    email: '',
    adresse: '',
  });

  // Form data for password
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility toggles
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Load user data into form when user changes or entering edit mode
  useEffect(() => {
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || '',
        email: user.email || '',
        adresse: user.adresse || '',
      });
    }
  }, [user, isEditing]);

  if (!user) return <LoadingSpinner className="py-12" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call API to update profile
      const updatedUser = await usersApi.updateProfile({
        prenom: formData.prenom,
        nom: formData.nom,
        telephone: formData.telephone,
        email: formData.email || null,
        adresse: formData.adresse,
      });

      // Update user in context
      updateUser(updatedUser);

      refreshWithSuccess('Profil modifie avec succes');
      setIsEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la modification du profil';
      refreshWithError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        telephone: user.telephone || '',
        email: user.email || '',
        adresse: user.adresse || '',
      });
    }
    setIsEditing(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      refreshWithError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      refreshWithError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsLoading(true);
    try {
      await usersApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      refreshWithSuccess('Mot de passe changé avec succès');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe';
      refreshWithError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Password input with eye icon
  const PasswordInput = ({
    label,
    value,
    onChange,
    visible,
    onToggle,
    id,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    visible: boolean;
    onToggle: () => void;
    id: string;
  }) => (
    <div className="relative">
      <Input
        id={id}
        name={id}
        label={label}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-300 transition-colors"
        tabIndex={-1}
      >
        {visible ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="Mon Profil"
        description="Gérer vos informations personnelles"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Modifier
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo de profil */}
                <div className="flex justify-center pb-4 border-b border-slate-700/50">
                  <ImageUpload
                    currentImage={profileImage}
                    onImageSelect={(file) => {
                      // Convertir le fichier en base64 pour l'aperçu
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setProfileImage(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    onImageRemove={() => setProfileImage(null)}
                    placeholder={`${formData.prenom.charAt(0)}${formData.nom.charAt(0)}`}
                    shape="circle"
                    size="lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    id="prenom"
                    name="prenom"
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                  <Input
                    id="nom"
                    name="nom"
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <Input
                  id="telephone"
                  name="telephone"
                  label="Téléphone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  required
                />
                <Input
                  id="email"
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  id="adresse"
                  name="adresse"
                  label="Adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button type="submit" isLoading={isLoading} className="flex-1">
                    Enregistrer
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel}>
                    Annuler
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${user.prenom} ${user.nom}`}
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-500/30"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-2xl font-medium">
                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-semibold">{user.prenom} {user.nom}</h4>
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                      user.role === 'SUPER_ADMIN' ? 'bg-purple-500/20 text-purple-400' :
                      user.role === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <InfoRow label="Téléphone" value={user.telephone} />
                <InfoRow label="Email" value={user.email || '-'} />
                <InfoRow label="Adresse" value={user.adresse || '-'} />
                
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-400 mb-2">Accès aux espaces:</p>
                  <div className="flex gap-4">
                    <span className={`text-sm ${user.accessPressing ? 'text-green-400' : 'text-red-400'}`}>
                      {user.accessPressing ? '✓' : '✗'} Pressing
                    </span>
                    <span className={`text-sm ${user.accessAtelier ? 'text-green-400' : 'text-red-400'}`}>
                      {user.accessAtelier ? '✓' : '✗'} Atelier
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Changement de mot de passe */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-6">Changer le mot de passe</h3>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <PasswordInput
                id="currentPassword"
                label="Mot de passe actuel"
                value={passwordData.currentPassword}
                onChange={(value) => setPasswordData({ ...passwordData, currentPassword: value })}
                visible={showPasswords.current}
                onToggle={() => togglePasswordVisibility('current')}
              />
              <PasswordInput
                id="newPassword"
                label="Nouveau mot de passe"
                value={passwordData.newPassword}
                onChange={(value) => setPasswordData({ ...passwordData, newPassword: value })}
                visible={showPasswords.new}
                onToggle={() => togglePasswordVisibility('new')}
              />
              <PasswordInput
                id="confirmPassword"
                label="Confirmer le nouveau mot de passe"
                value={passwordData.confirmPassword}
                onChange={(value) => setPasswordData({ ...passwordData, confirmPassword: value })}
                visible={showPasswords.confirm}
                onToggle={() => togglePasswordVisibility('confirm')}
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                Changer le mot de passe
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-slate-700/50">
      <span className="text-slate-400">{label}</span>
      <span>{value}</span>
    </div>
  );
}
