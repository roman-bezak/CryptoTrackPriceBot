import { BotMessages, ErrorMessages } from '../../../shared/messages/index.js';
import { userService } from '../services/user.service.js';

import type { Context } from 'telegraf';

export class UserHandlers {
  /**
   * Handler for /users command (admin only)
   */
  public async handleGetUsers(ctx: Context): Promise<void> {
    try {
      const users = await userService.getAllUsers();

      if (users.length === 0) {
        await ctx.reply(BotMessages.NO_USERS);
        return;
      }

      let message = BotMessages.USERS_LIST_HEADER;
      for (const user of users) {
        message += BotMessages.USER_INFO_TEMPLATE(user);
      }

      await ctx.reply(message.trim());
    } catch (error) {
      console.error(ErrorMessages.GET_ALERTS_FAILED, error);
      await ctx.reply(BotMessages.ERROR_FETCHING_USERS);
    }
  }
}
