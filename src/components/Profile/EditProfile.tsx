import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';
import { ContactProps, ProfileProps } from './Profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import ProfileSection from './ProfileSection';
import LinkAccountSection from './LinkAccountSection';

interface UpdateProfileVariableType {
  clerkId: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

interface UpdateContactVariableType {
  clerkId: string;
  discord?: string | '';
  instagram?: string | '';
  phone?: string | '';
  whatsApp?: string | '';
  isContactPublic?: boolean;
  isPhotographer?: boolean;
}

interface EditProfileProps {
  profile: ProfileProps;
  contact: ContactProps;
  clerkId: string;
  refetchProfile: () => void;
  refetchContact: () => void;
}

type ComponentType = 0 | 1 | 2;

export default function EditProfile({
  contact,
  profile,
  clerkId,
  refetchProfile,
  refetchContact,
}: EditProfileProps) {
  // Calling TRPC update procedures
  const updateProfile = trpc.profile.updateProfile.useMutation({
    onSuccess: () => {
      console.log('Profile fields updated successfully');
      refetchProfile();
      setIsProfileUpdateSuccessful(true);
    },
    onError: (err) => {
      console.error('Error updating Profile fields ', err);
      setIsProfileUpdateSuccessful(false);
    },
  });

  const updateContact = trpc.contact.updateContact.useMutation({
    onSuccess: () => {
      console.log('Contact fields updated successfully');
      refetchContact();
      setIsProfileUpdateSuccessful(true);
    },
    onError: (err) => {
      console.error('Error updating Contact fields', err);
      setIsProfileUpdateSuccessful(false);
    },
  });
  // Holds the state of which component is shown in this Component(EditProfile) (numbers: 0-2)
  const [currentComponent, setCurrentComponent] = useState<ComponentType>(0);
  const [isProfileUpdateSuccessful, setIsProfileUpdateSuccessful] =
    useState<boolean>(false);

  // Form validation
  const formSchema = z.object({
    firstName: z
      .string()
      .min(1, { message: 'First Name required' })
      .refine((value) => /^[a-zA-Z\s]*$/.test(value), {
        message: 'First Name should not contain numbers or punctuation',
      })
      .optional(),
    lastName: z
      .string()
      .min(1, { message: 'Last Name required' })
      .refine((value) => /^[a-zA-Z\s]*$/.test(value), {
        message: 'Last Name should not contain numbers or punctuation',
      })
      .optional(),
    email: z.string().optional(),
    discord: z.string().optional(),
    instagram: z.string().optional(),
    phone: z.string().optional(),
    whatsApp: z.string().optional(),
    isContactPublic: z
      .boolean({ invalid_type_error: 'isContactPublic must be a boolean' })
      .optional(),
    isPhotographer: z
      .boolean({ invalid_type_error: 'isPhotographer must be a boolean' })
      .optional(),
    bio: z
      .string()
      .max(150, { message: 'Bio must be 150 characters or less' })
      .optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: contact.email,
      phone: contact.phone || '',
      whatsApp: contact.whatsApp || '',
      instagram: contact.instagram || '',
      discord: contact.discord || '',
      isContactPublic: contact.isContactPublic,
      isPhotographer: contact.isPhotographer,
      bio: profile.bio || '',
    },
  });

  function onSave(values: z.infer<typeof formSchema>) {
    // Cut white spaces off inputs
    const trimmedFirstName = values.firstName?.trim();
    const trimmedLastName = values.lastName?.trim();
    const trimmedDiscordLink = values.discord?.trim();
    const trimmedInstagramLink = values.instagram?.trim();
    const trimmedWhatsAppLink = values.whatsApp?.trim();
    const trimmedPhone = values.phone?.trim();
    const trimmedBio = values.bio?.trim();

    // Checks Profile fields (checks if state variable doesn't equal saved variable in db)
    const updatedProfileData: UpdateProfileVariableType = { clerkId };
    if (trimmedFirstName !== profile.firstName)
      updatedProfileData.firstName = trimmedFirstName;
    if (trimmedLastName !== profile.lastName)
      updatedProfileData.lastName = trimmedLastName;
    if (trimmedBio !== profile.bio) updatedProfileData.bio = trimmedBio;

    // Checks Contact fields (checks if state variable doesn't equal saved variable in db)
    const updatedContactData: UpdateContactVariableType = { clerkId };
    if (values.isContactPublic !== contact.isContactPublic)
      updatedContactData.isContactPublic = values.isContactPublic;
    if (values.isPhotographer !== contact.isPhotographer)
      updatedContactData.isPhotographer = values.isPhotographer;
    if (trimmedDiscordLink !== contact.discord)
      updatedContactData.discord = values.discord;
    if (trimmedInstagramLink !== contact.instagram)
      updatedContactData.instagram = values.instagram;
    if (trimmedPhone !== contact.phone) updatedContactData.phone = values.phone;
    if (trimmedWhatsAppLink !== contact.whatsApp)
      updatedContactData.whatsApp = values.whatsApp;

    // Update Profile and Contact fields
    if (Object.keys(updatedProfileData).length > 1) {
      updateProfile.mutate(updatedProfileData);
    }
    if (Object.keys(updatedContactData).length > 1) {
      updateContact.mutate(updatedContactData);
    }
  }

  return (
    <div>
      {isProfileUpdateSuccessful && <div className="bg-green-600">Updated</div>}
      <div className="mb-8 flex flex-col border-b-2">
        <div className="flex flex-col">
          <p className="text-2xl font-bold">Settings</p>
        </div>
        <div className="mt-2 flex">
          <button
            className={`mr-5 p-3 transition-all duration-500 ${currentComponent === 0 ? 'border-b-4 border-sky-950' : 'border-b-4 border-transparent'}`}
            onClick={() => setCurrentComponent(0)}
          >
            Profile
          </button>
          <button
            className={`mr-5 p-3 transition-all duration-500 ${currentComponent === 1 ? 'border-b-4 border-sky-950' : 'border-b-4 border-transparent'}`}
            onClick={() => setCurrentComponent(1)}
          >
            Link Account
          </button>
          <button
            className={`mr-5 p-3 transition-all duration-500 ${currentComponent === 2 ? 'border-b-4 border-sky-950' : 'border-b-4 border-transparent'}`}
            onClick={() => setCurrentComponent(2)}
          >
            Pictures
          </button>
        </div>
      </div>
      {currentComponent === 0 && (
        <ProfileSection
          form={form}
          onSave={onSave}
          profileUrl={profile?.profilePic.url}
        />
      )}
      {currentComponent === 1 && (
        <LinkAccountSection form={form} onSave={onSave} />
      )}
    </div>
  );
}
