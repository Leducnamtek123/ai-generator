import fs from 'node:fs/promises';
import path from 'node:path';

const repoRoot = process.cwd();
const backendSrc = path.join(repoRoot, 'backend', 'src');
const outputFile = path.join(repoRoot, 'frontend', 'src', 'content', 'api-endpoints.generated.ts');

const routeMethods = ['Get', 'Post', 'Put', 'Patch', 'Delete', 'All', 'Head', 'Options'];

function parseQuotedValue(source, key) {
    const match = source.match(new RegExp(`${key}\\s*:\\s*['"]([^'"]+)['"]`));
    return match?.[1] ?? '';
}

function parseControllerMeta(source, filePath) {
    const apiTagsMatch = source.match(/@ApiTags\(([\s\S]*?)\)/);
    const tagMatch = apiTagsMatch?.[1]?.match(/['"`]([^'"`]+)['"`]/);
    const tag = tagMatch?.[1] ?? path.basename(filePath, '.ts').replace(/\.controller$/, '').replace(/\.ts$/, '');

    const controllerMatch = source.match(/@Controller\(([\s\S]*?)\)\s*export class/);
    const controllerArg = controllerMatch?.[1]?.trim() ?? '';

    let controllerPath = '';
    let version = '';

    if (controllerArg.startsWith('{')) {
        controllerPath = parseQuotedValue(controllerArg, 'path');
        version = parseQuotedValue(controllerArg, 'version');
    } else if (controllerArg) {
        const stringMatch = controllerArg.match(/['"`]([^'"`]+)['"`]/);
        controllerPath = stringMatch?.[1] ?? '';
    }

    return { tag, controllerPath, version };
}

function buildRoute(controllerMeta, methodPath) {
    const segments = [];

    if (!controllerMeta.version && controllerMeta.controllerPath === '' && methodPath === '') {
        return '/';
    }

    segments.push('api');

    if (controllerMeta.version) {
        const version = controllerMeta.version.replace(/^v/i, '');
        segments.push(`v${version}`);
    }

    if (controllerMeta.controllerPath) {
        segments.push(controllerMeta.controllerPath.replace(/^\/+|\/+$/g, ''));
    }

    if (methodPath) {
        segments.push(methodPath.replace(/^\/+|\/+$/g, ''));
    }

    const route = segments
        .filter((segment) => segment !== '')
        .join('/')
        .replace(/\/+/g, '/')
        .replace(/\/$/, '');

    return `/${route || ''}` || '/';
}

async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const resolved = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walk(resolved)));
            continue;
        }

        if (entry.isFile() && entry.name.endsWith('.controller.ts')) {
            files.push(resolved);
        }
    }

    return files;
}

const controllerFiles = await walk(backendSrc);
const groups = new Map();

for (const filePath of controllerFiles) {
    const source = await fs.readFile(filePath, 'utf8');
    const controllerMeta = parseControllerMeta(source, filePath);
    const lines = source.split(/\r?\n/);

    for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index];
        const routeMatch = line.match(/^\s*@(?<method>Get|Post|Put|Patch|Delete|All|Head|Options)\s*\(\s*(?<args>[^)]*)\s*\)\s*$/);
        if (!routeMatch?.groups?.method) {
            continue;
        }

        let methodLineIndex = index + 1;
        while (
            methodLineIndex < lines.length &&
            !/^\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?[A-Za-z_]\w*\s*\(/.test(lines[methodLineIndex])
        ) {
            methodLineIndex += 1;
        }

        if (methodLineIndex >= lines.length) {
            continue;
        }

        const lookaroundStart = Math.max(0, index - 6);
        const lookaroundEnd = Math.min(lines.length, methodLineIndex + 1);
        const block = lines.slice(lookaroundStart, lookaroundEnd).join('\n');

        if (/@ApiExcludeEndpoint\s*\(/.test(block)) {
            continue;
        }

        const methodNameMatch = lines[methodLineIndex].match(/^\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?(?<name>[A-Za-z_]\w*)\s*\(/);
        const methodName = methodNameMatch?.groups?.name ?? routeMatch.groups.method.toLowerCase();
        const methodPathMatch = routeMatch.groups.args.match(/['"`]([^'"`]+)['"`]/);
        const methodPath = methodPathMatch?.[1] ?? '';
        const summaryMatch = block.match(/summary:\s*['"`]([^'"`]+)['"`]/);

        const route = buildRoute(controllerMeta, methodPath);
        const tag = controllerMeta.tag || path.basename(filePath, '.ts');
        const method = routeMatch.groups.method.toUpperCase();
        const summary =
            summaryMatch?.[1] ||
            `${method} ${route}`;

        const group = groups.get(tag) ?? {
            tag,
            description: '',
            items: [],
        };

        group.items.push({
            method,
            path: route,
            summary,
            source: path.relative(repoRoot, filePath).replace(/\\/g, '/'),
            operation: methodName,
        });
        groups.set(tag, group);
    }
}

const orderedGroups = [...groups.values()]
    .map((group) => ({
        ...group,
        items: group.items.sort((left, right) => {
            const methodRank = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', 'ALL'];
            const leftRank = methodRank.indexOf(left.method);
            const rightRank = methodRank.indexOf(right.method);
            if (leftRank !== rightRank) {
                return leftRank - rightRank;
            }
            return left.path.localeCompare(right.path);
        }),
    }))
    .sort((left, right) => left.tag.localeCompare(right.tag));

const fileContent = `/* eslint-disable */\n/* This file is generated by scripts/generate-api-endpoints.mjs. Do not edit manually. */\n\nexport const apiEndpointGroups = ${JSON.stringify(orderedGroups, null, 2)} as const;\n`;

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, fileContent, 'utf8');

console.log(`Wrote ${orderedGroups.length} endpoint groups to ${path.relative(repoRoot, outputFile)}`);
