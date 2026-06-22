<?php

namespace Pterodactyl\Http\Requests\Admin;

use Illuminate\Validation\Rule;
use Pterodactyl\Models\Tenant;

class TenantMemberFormRequest extends AdminFormRequest
{
    public function rules(): array
    {
        return [
            'user_id' => 'sometimes|nullable|integer|exists:users,id',
            'email' => 'sometimes|nullable|email:rfc,dns|exists:users,email',
            'role' => ['required', 'string', Rule::in([
                Tenant::ROLE_OWNER,
                Tenant::ROLE_ADMIN,
                Tenant::ROLE_MEMBER,
            ])],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (!$this->filled('user_id') && !$this->filled('email')) {
                $validator->errors()->add('email', 'Either a user ID or email address is required.');
            }
        });
    }
}
