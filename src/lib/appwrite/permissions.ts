import { Permission, Role } from "node-appwrite";

export function createLeadPermissions(ownerId: string) {
  return [Permission.read(Role.user(ownerId)), Permission.update(Role.user(ownerId)), Permission.delete(Role.user(ownerId))];
}

export function createOwnerPermissions(ownerId: string) {
  return [Permission.read(Role.user(ownerId)), Permission.update(Role.user(ownerId)), Permission.delete(Role.user(ownerId))];
}
