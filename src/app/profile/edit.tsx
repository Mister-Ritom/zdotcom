import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useAuthStore } from '@/stores/useAuthStore';
import { userService } from '@/services/userService';
import { supabase } from '@/services/supabase';

const ACCENT = '#208AEF';

export default function EditProfileScreen() {
  const isDark = useColorScheme() === 'dark';
  const { user } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (user?.id) {
      userService.getById(user.id).then((p) => {
        if (p) {
          setDisplayName(p.displayName);
          setBio(p.bio ?? '');
          setProfilePictureUrl(p.profilePictureUrl ?? null);
          setCoverPhotoUrl(p.coverPhotoUrl ?? null);
        }
        setLoading(false);
      });
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id) return;
    if (!displayName.trim()) {
      Alert.alert('Error', 'Display name cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await userService.updateProfile(user.id, {
        displayName,
        bio,
        profilePictureUrl: profilePictureUrl || undefined,
        coverPhotoUrl: coverPhotoUrl || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (uri: string, bucket: string): Promise<string> => {
    try {
      const ext = uri.split('.').pop() || 'jpg';
      const fileName = `${user?.id}_${Date.now()}.${ext}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const { error } = await supabase.storage.from(bucket).upload(fileName, blob, {
        contentType: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      });
      if (error) throw error;
      
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      return publicData.publicUrl;
    } catch (e) {
      console.error('Upload failed', e);
      throw e;
    }
  };

  const pickImage = async (type: 'profile' | 'cover') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'profile' ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadingImage(true);
        const bucket = type === 'profile' ? 'profile_pictures' : 'cover_photos';
        const url = await uploadImage(result.assets[0].uri, bucket);
        if (type === 'profile') setProfilePictureUrl(url);
        else setCoverPhotoUrl(url);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090B' : '#FFF' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={22} color={isDark ? '#FFF' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#000' }]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={ACCENT} />
          ) : (
            <Text style={styles.saveBtn}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Profile Picture & Cover Photo Edit */}
        <View style={styles.imageEditContainer}>
          <TouchableOpacity onPress={() => pickImage('cover')} style={styles.coverEdit}>
            {coverPhotoUrl ? (
              <Image source={{ uri: coverPhotoUrl }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: isDark ? '#1C1917' : '#E7E5E4' }]} />
            )}
            <View style={styles.cameraOverlay}>
              <Camera size={24} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.profileEditWrapper}>
            <TouchableOpacity onPress={() => pickImage('profile')} style={styles.profileEdit}>
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={styles.profileImage} contentFit="cover" />
              ) : (
                <View style={[styles.profilePlaceholder, { backgroundColor: isDark ? '#27272A' : '#D4D4D8' }]} />
              )}
              <View style={styles.cameraOverlay}>
                <Camera size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {uploadingImage && (
          <ActivityIndicator size="small" color={ACCENT} style={{ marginBottom: 16 }} />
        )}

        <Text style={styles.label}>Display Name</Text>
        <TextInput
          style={[styles.input, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#27272A' : '#E4E4E7' }]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Display Name"
          placeholderTextColor="#666"
        />

        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.bioInput, { color: isDark ? '#FFF' : '#000', borderColor: isDark ? '#27272A' : '#E4E4E7' }]}
          value={bio}
          onChangeText={setBio}
          placeholder="Write something about yourself..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.1)',
  },
  iconBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  saveBtn: { fontSize: 16, fontWeight: '700', color: ACCENT },
  content: { padding: 16 },
  label: { fontSize: 14, color: '#888', marginBottom: 6, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 20,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  imageEditContainer: {
    marginBottom: 32,
    alignItems: 'center',
  },
  coverEdit: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
  },
  profileEditWrapper: {
    position: 'absolute',
    bottom: -24,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#000',
    overflow: 'hidden',
  },
  profileEdit: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.4)',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
