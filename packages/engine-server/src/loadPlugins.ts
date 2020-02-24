import { Plugin } from '@contember/engine-plugins'
import S3Plugin from '@contember/engine-s3-plugin'

export default function loadPlugins(): Promise<Plugin[]> {
	return Promise.resolve([new S3Plugin()])
}
