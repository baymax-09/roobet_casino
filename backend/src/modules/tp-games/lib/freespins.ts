/**
 * The supported freespin-issuing systems.
 */
export enum FreespinSystemNameEnum {
  System = 'system',
}

export type FreespinIssuer = FreespinSystemNameEnum | string
