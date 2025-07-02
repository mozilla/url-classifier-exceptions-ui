/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

export type RSEnvironment = "dev" | "stage" | "prod";

export function isRSEnvValid(env: string | null): env is RSEnvironment;
export function getRSEndpoint(env: RSEnvironment, isPreview: boolean): URL;
export function getRSEndpointMeta(env: RSEnvironment, isPreview: boolean): URL;
