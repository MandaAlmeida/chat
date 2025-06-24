import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { EnvDTO } from "@/contracts/env.dto";


@Injectable()
export class EnvService {
    constructor(private configService: ConfigService<EnvDTO, true>) { }

    get<T extends keyof EnvDTO>(key: T): EnvDTO[T] {
        return this.configService.get<EnvDTO[T]>(key, { infer: true }) as EnvDTO[T]
    }
}