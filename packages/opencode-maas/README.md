# @hwcli/opencode-maas

Huawei Cloud MaaS provider plugin for OpenCode.

This plugin adds support for Huawei Cloud ModelArts Model as a Service (MaaS) to OpenCode, allowing you to use Huawei's hosted AI models.

## Installation

Install the plugin using the OpenCode CLI:

```bash
opencode plugin https://cli.hwctools.site/opencode-maas.tgz
```

## Configuration

### API Key

Run `/connect` in opencode and select Huawei Cloud MaaS to paste your API key in the prompt.

You can also set your Huawei Cloud MaaS API key as an environment variable:

```bash
export HUAWEI_CLOUD_MAAS_API_KEY="your-api-key-here"
```

### Available Models

The following models are available through Huawei Cloud MaaS:

- `deepseek-v3.2`
- `deepseek-v3.1-terminus`
- `DeepSeek-V3`
- `glm-5`
- `glm-5.1`
- `deepseek-r1-250528`

## Compatibility

Requires OpenCode version **>=1.14.28**.

## Usage

Once installed, you can use any of the supported models with the `-m` flag:

```bash
opencode -m huawei-maas/deepseek-v3.2
```

Or specify the model in your OpenCode configuration file.

## Provider ID

- **Provider ID**: `huawei-maas`
- **Endpoint**: `https://api-ap-southeast-1.modelarts-maas.com/openai/v1`
