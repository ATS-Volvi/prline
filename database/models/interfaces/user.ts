export interface IUser{
    name:string
    email:string
    password:string
    isVerified:boolean
    userType?:string
}

export interface ILogin{
    email:string
    password:string
}