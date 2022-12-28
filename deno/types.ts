export type ComponentField = {
  custom_id: string;
  type: number;
  value: string;
};

export type ComponentInInteractionData = {
  components: ComponentField[];
  type: 1;
};

export type InteractedMessage = {
  application_id: string;
  attachments: [];
  author: User;
  channel_id: string;
  components: {
    components: [
      {
        custom_id: string;
        label: string;
        style: number;
        type: number;
      },
    ];
    type: number;
  }[];
  content: string;
  edited_timestamp: string | null;
  embeds: [];
  flags: number;
  id: string;
  interaction: {
    id: string;
    name: string;
    type: number;
    user: User;
  };
  mention_everyone: boolean;
  mention_roles: [];
  mentions: [];
  pinned: boolean;
  timestamp: string;
  tts: boolean;
  type: number;
  webhook_id: string;
};

export type InteractionData =
  | {
      guild_id: string;
      id: string;
      name: string;
      resolved: Resolved;
      target_id: string;
      type: number;
      options?: Option[];
    }
  | {
      components: ComponentInInteractionData[];
      custom_id: string;
    };

export interface InteractingMember {
  avatar: null | string;
  communication_disabled_until: null | string;
  deaf: boolean;
  flags: number;
  is_pending: boolean;
  joined_at: string;
  mute: boolean;
  nick: null | string;
  pending: boolean;
  permissions: string;
  premium_since: null | string;
  roles: string[];
  user: User;
}

export interface Option {
  name: string;
}

export interface Resolved {
  members: Members;
  users: Users;
}

export interface Members {
  [key: string]: Member;
}

export interface Member {
  avatar: null;
  communication_disabled_until: null;
  flags: number;
  is_pending: boolean;
  joined_at: Date;
  nick: null | string;
  pending: boolean;
  permissions: string;
  premium_since: null;
  roles: string[];
}

export interface Users {
  [key: string]: User;
}

export interface User {
  avatar: string;
  avatar_decoration: null;
  discriminator: string;
  id: string;
  public_flags: number;
  username: string;
}

export type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at: number;
};

export type Metadata = {
  ageGroup: string;
};
